import { Link2 } from "lucide-react";
import {
  siDiscord,
  siGithub,
  siInstagram,
  siRiotgames,
  siRoblox,
  siSnapchat,
  siSoundcloud,
  siSpotify,
  siSteam,
  siTelegram,
  siTidal,
  siTiktok,
  siTwitch,
  siX,
  siYoutube,
} from "simple-icons";
import type { SimpleIcon } from "simple-icons";
import type { Brand } from "../config/profile";

/**
 * Brand glyphs come from simple-icons (CC0). Only the icons in this map are
 * pulled into the bundle, so adding more brands costs nothing until you use them.
 */
const registry: Partial<Record<Brand, SimpleIcon>> = {
  discord: siDiscord,
  spotify: siSpotify,
  tiktok: siTiktok,
  instagram: siInstagram,
  youtube: siYoutube,
  x: siX,
  telegram: siTelegram,
  github: siGithub,
  snapchat: siSnapchat,
  twitch: siTwitch,
  steam: siSteam,
  roblox: siRoblox,
  riot: siRiotgames,
  soundcloud: siSoundcloud,
  tidal: siTidal,
};

export function brandColor(brand: Brand): string {
  return registry[brand]?.hex ? `#${registry[brand]?.hex}` : "#ffffff";
}

export function BrowserIcon({
  brand,
  size = 20,
  className,
}: {
  brand: Brand;
  size?: number;
  className?: string;
}) {
  const icon = registry[brand];

  if (!icon) {
    return <Link2 size={size} className={className} aria-hidden="true" />;
  }

  return (
    /* Always decorative — every caller labels its own control. */
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
    >
      <path d={icon.path} />
    </svg>
  );
}
