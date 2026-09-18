import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { audio as audioConfig } from "../config/profile";
import type { Track } from "../config/profile";
import { useLocalStorage } from "./hooks";

/** A placeholder like <<< /media/track.mp3 >>> means "not configured yet". */
export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || value.trim() === "" || value.includes("<<<") || value.includes(">>>");
}

const realTracks = audioConfig.tracks.filter((t) => !isPlaceholder(t.src));

export interface AudioApi {
  /** True when at least one real audio file is configured. */
  configured: boolean;
  /** True once the visitor has interacted and playback was attempted. */
  started: boolean;
  tracks: Track[];
  index: number;
  current: Track | null;
  playing: boolean;
  muted: boolean;
  volume: number;
  time: number;
  duration: number;
  progress: number;
  error: string | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  select: (index: number) => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioApi | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useLocalStorage("twix:muted", false);
  const [volume, setVolumeState] = useLocalStorage("twix:volume", audioConfig.volume);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const elRef = useRef<HTMLAudioElement | null>(null);
  const configured = realTracks.length > 0;

  /* Create the single <audio> element once. */
  useEffect(() => {
    if (!configured || typeof window === "undefined") return;
    const el = new Audio();
    el.preload = "metadata";
    el.crossOrigin = "anonymous";
    elRef.current = el;

    const onTime = () => setTime(el.currentTime);
    const onMeta = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const onEnd = () => {
      if (realTracks.length > 1) setIndex((i) => (i + 1) % realTracks.length);
    };
    const onErr = () => setError("Audio file could not be loaded — check the path in src/config/profile.ts");
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onErr);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    return () => {
      el.pause();
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onErr);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      elRef.current = null;
    };
  }, [configured]);

  /* Keep the element in sync with volume / mute. */
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.volume = Math.min(Math.max(muted ? 0 : volume, 0), 1);
    el.muted = muted;
  }, [volume, muted, index]);

  /* Swap source when the track changes, resuming if we were playing. */
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const track = realTracks[index];
    if (!track) return;
    setError(null);
    setTime(0);
    setDuration(0);
    const wasPlaying = !el.paused && started;
    el.loop = realTracks.length === 1; // a single track should just keep playing
    el.src = track.src;
    el.load();
    if (wasPlaying) {
      void el.play().catch(() => setPlaying(false));
    }
  }, [index, started]);

  const play = useCallback(() => {
    const el = elRef.current;
    setStarted(true);
    if (!el || !configured) return;
    void el
      .play()
      .then(() => setError(null))
      .catch(() => {
        // Autoplay blocked — the dock stays clickable so the visitor can start it.
        setPlaying(false);
      });
  }, [configured]);

  const pause = useCallback(() => {
    elRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const el = elRef.current;
    if (!el || !configured) return;
    if (el.paused) play();
    else pause();
  }, [configured, pause, play]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(realTracks.length, 1));
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + Math.max(realTracks.length, 1)) % Math.max(realTracks.length, 1));
  }, []);

  const select = useCallback((i: number) => {
    setIndex(i);
    setStarted(true);
  }, []);

  const seek = useCallback((seconds: number) => {
    const el = elRef.current;
    if (!el) return;
    el.currentTime = seconds;
    setTime(seconds);
  }, []);

  const setVolume = useCallback(
    (value: number) => {
      setVolumeState(Math.min(Math.max(value, 0), 1));
      if (value > 0) setMuted(false);
    },
    [setMuted, setVolumeState],
  );

  const toggleMute = useCallback(() => setMuted((m) => !m), [setMuted]);

  // Build a stable API ref that components read from the context.
  // Reactive state is stored in a separate ref updated every render so
  // subscribers don't re-render on every timeupdate tick.
  const apiRef = useRef<AudioApi>({
    configured,
    started,
    tracks: realTracks,
    index,
    current: realTracks[index] ?? null,
    playing,
    muted,
    volume,
    time,
    duration,
    progress: duration > 0 ? Math.min(time / duration, 1) : 0,
    error,
    play,
    pause,
    toggle,
    next,
    prev,
    select,
    seek,
    setVolume,
    toggleMute,
  });

  // Keep the ref's reactive fields in sync every render (synchronous, no extra renders).
  const api = apiRef.current;
  api.configured = configured;
  api.started = started;
  api.index = index;
  api.current = realTracks[index] ?? null;
  api.playing = playing;
  api.muted = muted;
  api.volume = volume;
  api.time = time;
  api.duration = duration;
  api.progress = duration > 0 ? Math.min(time / duration, 1) : 0;
  api.error = error;
  // Stable callbacks never change identity — no update needed.

  return <AudioContext.Provider value={api}>{children}</AudioContext.Provider>;
}

export function useAudio(): AudioApi {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used inside <AudioProvider>");
  return ctx;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
