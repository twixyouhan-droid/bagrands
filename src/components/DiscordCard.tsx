import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { discord as discordConfig, profile } from "../config/profile";
import type { LanyardData } from "../lib/lanyard";
import { activityText, customStatusText, lanyardAvatarUrl } from "../lib/lanyard";
import { isPlaceholder } from "../lib/audio";

const STATUS_META: Record<string, { color: string; label: string }> = {
  online: { color: "#3ba55d", label: "online" },
  idle: { color: "#faa81a", label: "idle" },
  dnd: { color: "#ed4245", label: "do not disturb" },
  offline: { color: "#747f8d", label: "offline" },
};

/**
 * Live Discord presence through Lanyard when `discord.userId` is set,
 * otherwise the static values from the config. No tokens, ever.
 * Click the card to unfold the extra details.
 */
export function DiscordCard({ presence, live }: { presence: LanyardData | null; live: boolean }) {
  const [open, setOpen] = useState(false);

  if (!discordConfig.enabled) return null;

  const user = presence?.discord_user;
  const displayName = user?.global_name || user?.username || discordConfig.displayName;
  const tag = user?.username ?? discordConfig.tag;
  const status = (presence?.discord_status ?? discordConfig.status) as keyof typeof STATUS_META;
  const meta = STATUS_META[status] ?? STATUS_META.online;
  const custom = presence ? customStatusText(presence.activities) : discordConfig.customStatus;
  const activity = presence ? activityText(presence.activities) : discordConfig.activity;
  const avatar = lanyardAvatarUrl(presence) ?? (isPlaceholder(profile.avatar) ? null : profile.avatar);

  const details = [
    { label: "status", value: meta.label },
    { label: "pronouns", value: discordConfig.pronouns },
    { label: "member since", value: discordConfig.memberSince },
    { label: "connections", value: String(discordConfig.connections) },
  ];

  return (
    <section className="glass-soft hairline-top relative overflow-hidden rounded-2xl" aria-label="Discord presence">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Discord presence for ${displayName} — ${open ? "hide" : "show"} details`}
        data-cursor="hover"
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors duration-300 hover:bg-white/4"
      >
        <span className="relative shrink-0">
          <span
            className="absolute -inset-1 rounded-full opacity-60 blur-md"
            style={{ background: `radial-gradient(circle, ${meta.color}55, transparent 70%)` }}
            aria-hidden="true"
          />
          {avatar ? (
            <img
              src={avatar}
              alt=""
              width={44}
              height={44}
              loading="lazy"
              decoding="async"
              className="relative h-11 w-11 rounded-full border border-white/12 object-cover"
              style={{ filter: "grayscale(1) contrast(1.05)", objectPosition: profile.avatarFocus }}
            />
          ) : (
            <span className="relative grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/6 font-display text-sm text-white/70">
              {displayName.slice(0, 1)}
            </span>
          )}
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0b0d]"
            style={{ background: meta.color }}
            aria-hidden="true"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-white/92">{displayName}</span>
            <span className="truncate text-[11px] text-white/55">@{tag}</span>
            <span className="ml-auto flex shrink-0 items-center gap-1.5">
              {live && (
                <span className="label flex items-center gap-1 rounded-full border border-white/12 px-1.5 py-[1px]">
                  <span className="h-1 w-1 rounded-full bg-[#3ba55d]" aria-hidden="true" />
                  live
                </span>
              )}
              <ChevronDown
                size={13}
                className={`text-white/45 transition-transform duration-500 ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </span>
          </span>
          <span className="mt-1 block truncate text-[11px] text-white/55">{custom || "no status"}</span>
          {activity && (
            <span className="mt-0.5 block truncate text-[10.5px] text-white/55">
              <span className="text-white/50">playing</span> {activity}
            </span>
          )}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="discord-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-white/6 px-3.5 py-3 text-[10px]">
              {details.map((row) => (
                <div key={row.label}>
                  <dt className="label">{row.label}</dt>
                  <dd className="mt-0.5 truncate text-[11.5px] text-white/65">{row.value}</dd>
                </div>
              ))}
              <div className="col-span-2 flex items-center gap-2 text-[11px] text-white/45">
                <span className="label">badges</span>
                <span aria-hidden="true">{discordConfig.badgeIcons.join(" ")}</span>
                <span className="sr-only">{discordConfig.badgeIcons.length} badges</span>
              </div>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
