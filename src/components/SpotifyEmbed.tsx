import { useEffect, useRef, useState } from "react";
import { loadSpotifyApi, spotifyEmbedHeight, spotifyUri } from "../lib/spotify";
import type { SpotifyEmbedController } from "../lib/spotify";

/**
 * The official Spotify embed, driven by the iFrame API so it can start on
 * its own once the visitor has clicked "enter".
 *
 * Signed-out visitors hear Spotify's 30-second preview; anyone signed in to
 * Spotify gets the full track. If the API script can't load (blocked or
 * offline) it falls back to the plain iframe embed, which still works, just
 * without autoplay.
 */
export function SpotifyEmbed({ link, autoplay, entered }: { link: string; autoplay: boolean; entered: boolean }) {
  const host = useRef<HTMLDivElement | null>(null);
  const controller = useRef<SpotifyEmbedController | null>(null);
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);
  const uri = spotifyUri(link);
  const height = uri ? spotifyEmbedHeight(uri) : 152;

  /* Mount the controller once. */
  useEffect(() => {
    const el = host.current;
    if (!el || !uri) return;
    let cancelled = false;
    /* The API replaces the target node, so give it a child to consume. */
    const target = document.createElement("div");
    el.appendChild(target);

    loadSpotifyApi()
      .then((api) => {
        if (cancelled) return;
        api.createController(target, { uri, width: "100%", height, theme: "dark" }, (ctrl) => {
          if (cancelled) {
            ctrl.destroy();
            return;
          }
          controller.current = ctrl;
          ctrl.addListener("ready", () => setReady(true));
        });
      })
      .catch(() => {
        if (!cancelled) setFallback(true);
      });

    return () => {
      cancelled = true;
      controller.current?.destroy();
      controller.current = null;
      el.replaceChildren();
    };
  }, [uri, height]);

  /* Start once both the visitor has entered and the player is ready. */
  const started = useRef(false);
  useEffect(() => {
    if (!autoplay || !entered || !ready || started.current) return;
    started.current = true;
    controller.current?.play();
  }, [autoplay, entered, ready]);

  if (!uri) return null;

  if (fallback) {
    const [, type, id] = /^spotify:(\w+):(\w+)$/.exec(uri)!;
    return (
      <iframe
        title="Spotify"
        src={`https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`}
        width="100%"
        height={height}
        style={{ display: "block", border: 0, borderRadius: 12, colorScheme: "dark" }}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    );
  }

  return (
    <div
      ref={host}
      className="spotify-embed"
      style={{ height, borderRadius: 12, overflow: "hidden", colorScheme: "dark" }}
      aria-label="Spotify player"
    />
  );
}
