import { useEffect, useState } from "react";
import { isPlaceholder } from "./audio";

/**
 * Lanyard — public, token-free Discord presence API.
 * Docs: https://github.com/Phineas/lanyard
 */
export interface LanyardActivity {
  type: number;
  name: string;
  details?: string;
  state?: string;
  emoji?: { name: string; id?: string; animated?: boolean };
  assets?: { large_image?: string; small_image?: string; large_text?: string; small_text?: string };
  application_id?: string;
}

export interface LanyardSpotify {
  track_id: string;
  song: string;
  artist: string;
  album: string;
  album_art_url: string;
  timestamps: { start: number; end: number };
}

export interface LanyardData {
  discord_user: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    discriminator: string;
  };
  discord_status: "online" | "idle" | "dnd" | "offline";
  activities: LanyardActivity[];
  listening_to_spotify: boolean;
  spotify: LanyardSpotify | null;
  active_on_discord_web?: boolean;
  active_on_discord_desktop?: boolean;
  active_on_discord_mobile?: boolean;
}

interface Result {
  data: LanyardData | null;
  /** true while the very first request is in flight */
  loading: boolean;
  /** true when live data is being shown */
  live: boolean;
  offline: boolean;
}

const POLL_MS = 30_000; // bumped from 20s — Discord status doesn't need sub-30s freshness

export function useLanyard(userId: string): Result {
  const enabled = !isPlaceholder(userId);
  const [data, setData] = useState<LanyardData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      // Skip fetch while the tab is hidden — data will be stale anyway.
      if (document.hidden) return;
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { success: boolean; data?: LanyardData };
        if (cancelled) return;
        if (json.success && json.data) {
          setData(json.data);
          setOffline(false);
        } else {
          setOffline(true);
        }
      } catch {
        if (!cancelled) setOffline(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Use setInterval (stable, no nested scheduling) + visibility listener.
    void load();
    const interval = window.setInterval(load, POLL_MS);

    // Re-fetch immediately when the tab becomes visible again.
    const onVisible = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, userId]);

  return { data, loading, live: enabled && !offline && data !== null, offline };
}

export function lanyardAvatarUrl(data: LanyardData | null): string | null {
  if (!data?.discord_user?.avatar) return null;
  const { id, avatar } = data.discord_user;
  // Use webp for ~30% smaller avatars on supporting browsers.
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.webp?size=160`;
}

export function activityText(activities: LanyardActivity[]): string | null {
  const game = activities.find((a) => a.type === 0);
  if (!game) return null;
  const parts = [game.details, game.state].filter(Boolean);
  return parts.length ? `${game.name} — ${parts.join(" · ")}` : game.name;
}

export function customStatusText(activities: LanyardActivity[]): string | null {
  // Lanyard exposes custom statuses as type 4 activities.
  const custom = activities.find((a) => a.type === 4);
  if (!custom) return null;
  return [custom.emoji?.name, custom.state].filter(Boolean).join(" ").trim() || null;
}
