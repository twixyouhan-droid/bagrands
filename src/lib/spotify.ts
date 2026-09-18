/**
 * Spotify iFrame API loader.
 *
 * The plain <iframe> embed can't be started from the page. The iFrame API
 * (https://developer.spotify.com/documentation/embeds/references/iframe-api)
 * gives us a controller with play() / pause() / seek() and playback events,
 * which is what lets the track start right after the visitor clicks "enter".
 *
 * The script is loaded once, lazily, and every caller shares the promise.
 */

export interface SpotifyPlaybackUpdate {
  isPaused: boolean;
  isBuffering: boolean;
  duration: number;
  position: number;
}

export interface SpotifyEmbedController {
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  destroy: () => void;
  loadUri: (uri: string) => void;
  addListener: (event: "ready" | "playback_update", cb: (e: { data: SpotifyPlaybackUpdate }) => void) => void;
  removeListener: (event: "ready" | "playback_update") => void;
}

export interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number; theme?: "dark" | "light" },
    callback: (controller: SpotifyEmbedController) => void,
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

const SCRIPT_SRC = "https://open.spotify.com/embed/iframe-api/v1";
let pending: Promise<SpotifyIFrameAPI> | null = null;

export function loadSpotifyApi(): Promise<SpotifyIFrameAPI> {
  if (pending) return pending;
  pending = new Promise<SpotifyIFrameAPI>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("no document"));
      return;
    }
    const previous = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (api) => {
      previous?.(api);
      resolve(api);
    };
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onerror = () => {
      pending = null;
      reject(new Error("Spotify iFrame API failed to load"));
    };
    document.head.appendChild(script);
    /* If Spotify is blocked (ad blocker, offline) don't hang forever. */
    window.setTimeout(() => reject(new Error("Spotify iFrame API timed out")), 8000);
  });
  return pending;
}

/** open.spotify.com/track/ID → spotify:track:ID (also playlist / album / artist / show / episode). */
export function spotifyUri(link: string): string | null {
  const m = /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(playlist|album|track|artist|show|episode)\/([A-Za-z0-9]+)/.exec(link);
  if (m) return `spotify:${m[1]}:${m[2]}`;
  return /^spotify:(playlist|album|track|artist|show|episode):[A-Za-z0-9]+$/.test(link) ? link : null;
}

/** Compact card for a single track / episode, taller list for collections. */
export function spotifyEmbedHeight(uri: string): number {
  return /^spotify:(track|episode):/.test(uri) ? 80 : 152;
}
