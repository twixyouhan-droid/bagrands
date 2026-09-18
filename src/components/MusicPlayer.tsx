import { useEffect, useMemo, useState } from "react";
import { Music, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { audio as audioConfig, effects } from "../config/profile";
import { useTilt3D } from "../lib/tilt";
import { formatTime, isPlaceholder, useAudio } from "../lib/audio";
import type { LanyardSpotify } from "../lib/lanyard";
import { SpotifyEmbed } from "./SpotifyEmbed";

function Bars({ active }: { active: boolean }) {
  const delays = useMemo(() => [0, 180, 90, 260, 140], []);
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {delays.map((delay, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-white/70"
          style={{
            height: "100%",
            animation: active ? `eq ${820 + i * 90}ms ease-in-out ${delay}ms infinite` : "none",
            transform: active ? undefined : "scaleY(0.22)",
            transformOrigin: "bottom center",
          }}
        />
      ))}
    </span>
  );
}

function SeekBar({
  value,
  onSeek,
  disabled,
  label,
  valueText,
}: {
  value: number;
  onSeek?: (ratio: number) => void;
  disabled?: boolean;
  label: string;
  /** Human-readable position ("1:42") — a raw ratio means nothing aloud. */
  valueText?: string;
}) {
  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.001}
      value={Math.min(Math.max(value, 0), 1)}
      aria-label={label}
      aria-valuetext={valueText}
      disabled={disabled}
      onChange={(e) => onSeek?.(Number(e.target.value))}
      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/12 transition-colors hover:bg-white/20 disabled:cursor-default [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.7)] [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
      style={{
        backgroundImage: `linear-gradient(90deg, var(--accent) ${(Math.min(Math.max(value, 0), 1) * 100).toFixed(
          2,
        )}%, rgba(255,255,255,0.10) ${(Math.min(Math.max(value, 0), 1) * 100).toFixed(2)}%)`,
      }}
    />
  );
}

function ControlButton({
  children,
  onClick,
  label,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  disabled?: boolean;
  primary?: boolean;
}) {
  const ref = useTilt3D<HTMLButtonElement>(effects.tilt && !disabled, { max: 16, ease: 0.18 });
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      data-cursor="hover"
      className={`player-btn btn-3d grid place-items-center rounded-full transition-[color,background-color,border-color] duration-300 disabled:opacity-30 ${
        primary
          ? "h-9 w-9 border border-white/15 bg-white/8 text-white hover:border-white/35 hover:bg-white/15 active:brightness-75"
          : "h-8 w-8 text-white/60 hover:text-white active:brightness-75"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * One widget, four states:
 *  1. a local audio file is configured  → full player for your own track
 *  2. a Spotify link is configured      → the official Spotify embed
 *  3. nothing local but Spotify is live → live "listening to" view from Lanyard
 *  4. nothing configured                → a quiet hint on where to add audio
 */
export function MusicPlayer({
  spotify,
  live,
  entered = true,
}: {
  spotify: LanyardSpotify | null;
  live: boolean;
  entered?: boolean;
}) {
  const audio = useAudio();
  const [now, setNow] = useState(() => Date.now());
  const embed = !!audioConfig.spotifyEmbed && !isPlaceholder(audioConfig.spotifyEmbed);

  useEffect(() => {
    if (!spotify) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [spotify]);

  if (!audio.configured && embed) {
    return (
      <section className="glass-soft hairline-top overflow-hidden rounded-2xl p-1.5" aria-label="Spotify player">
        {/*
          The embed paints its own dark card; the 1.5px inset lets the glass
          hairline frame it so it sits in the widget instead of on top of it.
        */}
        <SpotifyEmbed link={audioConfig.spotifyEmbed} autoplay={audioConfig.spotifyAutoplay} entered={entered} />
      </section>
    );
  }

  if (!audio.configured && live && spotify) {
    const total = Math.max(spotify.timestamps.end - spotify.timestamps.start, 1);
    const elapsed = Math.min(Math.max(now - spotify.timestamps.start, 0), total);
    const ratio = elapsed / total;

    return (
      <section className="glass-soft hairline-top rounded-2xl px-3.5 py-3" aria-label="Listening to Spotify">
        <div className="flex items-center gap-3">
          {spotify.album_art_url ? (
            <img
              src={spotify.album_art_url}
              alt=""
              width={44}
              height={44}
              loading="lazy"
              className="h-11 w-11 rounded-xl border border-white/10 object-cover"
              style={{ filter: "grayscale(1) contrast(1.05)" }}
            />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/6">
              <Music size={16} className="text-white/60" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[12.5px] font-medium text-white/92">{spotify.song}</p>
              <Bars active />
            </div>
            <p className="truncate text-[11px] text-white/45">{spotify.artist}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-[9.5px] tabular-nums text-white/55">{formatTime(elapsed / 1000)}</span>
              <SeekBar
                value={ratio}
                disabled
                label="Spotify progress"
                valueText={`${formatTime(elapsed / 1000)} of ${formatTime(total / 1000)}`}
              />
              <span className="font-mono text-[9.5px] tabular-nums text-white/55">{formatTime(total / 1000)}</span>
            </div>
          </div>

          <a
            href={audioConfig.spotifyUrl.includes("<<<") ? "https://open.spotify.com" : audioConfig.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="chip shrink-0"
            aria-label="Open Spotify profile"
          >
            spotify
          </a>
        </div>
      </section>
    );
  }

  if (!audio.configured) {
    return (
      <section
        className="glass-soft hairline-top flex items-center gap-3 rounded-2xl px-3.5 py-3"
        aria-label="Music player"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
          <Music size={16} className="text-white/45" />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] text-white/70">No track configured</p>
          <p className="label mt-0.5 leading-snug">
            Drop an mp3 in <span className="text-white/55">public/media</span> and set{" "}
            <span className="text-white/55">audio.tracks</span> in src/config/profile.ts
          </p>
        </div>
      </section>
    );
  }

  const track = audio.current;

  return (
    <section className="glass-soft hairline-top rounded-2xl px-3.5 py-3" aria-label="Music player">
      <div className="flex items-center gap-3">
        {track?.artwork ? (
          <img
            src={track.artwork}
            alt=""
            width={44}
            height={44}
            loading="lazy"
            className="h-11 w-11 rounded-xl border border-white/10 object-cover"
          />
        ) : (
          <span
            className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10"
            style={{ background: "linear-gradient(150deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))" }}
          >
            <Music size={16} className="relative text-white/75" />
            {audio.playing && (
              <span
                className="absolute inset-0 anim-spin-slow"
                style={{
                  background: "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.28), transparent 45%)",
                }}
                aria-hidden="true"
              />
            )}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[12.5px] font-medium text-white/92">
              {track?.title ?? "Untitled"}
              {audio.playing && (
                <span className="ml-2 inline-flex align-middle">
                  <Bars active />
                </span>
              )}
            </p>
          </div>
          <p className="truncate text-[11px] text-white/45">{track?.artist ?? "unknown artist"}</p>

          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[9.5px] tabular-nums text-white/55">{formatTime(audio.time)}</span>
            <SeekBar
              value={audio.progress}
              label="Seek"
              valueText={`${formatTime(audio.time)} of ${formatTime(audio.duration)}`}
              onSeek={(ratio) => audio.seek(ratio * (audio.duration || 0))}
            />
            <span className="font-mono text-[9.5px] tabular-nums text-white/55">{formatTime(audio.duration)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ControlButton label="Previous track" onClick={audio.prev} disabled={audio.tracks.length < 2}>
            <SkipBack size={14} />
          </ControlButton>
          <ControlButton label={audio.playing ? "Pause" : "Play"} onClick={audio.toggle} primary>
            {audio.playing ? <Pause size={14} /> : <Play size={14} className="translate-x-[0.5px]" />}
          </ControlButton>
          <ControlButton label="Next track" onClick={audio.next} disabled={audio.tracks.length < 2}>
            <SkipForward size={14} />
          </ControlButton>
        </div>
      </div>

      {/* An async failure has to be announced, not just painted. */}
      {audio.error && (
        <p role="status" aria-live="polite" className="mt-2 text-[10px] text-amber-200/70">
          {audio.error}
        </p>
      )}
      {audio.tracks.length > 1 && (
        <p className="label mt-1.5 tabular-nums">
          {audioConfig.playerLabel} {audio.index + 1} of {audio.tracks.length}
        </p>
      )}
    </section>
  );
}
