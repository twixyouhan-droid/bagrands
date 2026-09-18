import { useEffect, useRef } from "react";
import { easterEggs, profile } from "../config/profile";
import { useClickBurst } from "../lib/hooks";
import { isPlaceholder } from "../lib/audio";
import { toast } from "../lib/toast";

const STATUS_COLORS: Record<string, string> = {
  online: "#3ba55d",
  idle: "#faa81a",
  dnd: "#ed4245",
  offline: "#747f8d",
};

export function Avatar({
  src,
  status = "online",
  size = 128,
}: {
  src?: string | null;
  status?: keyof typeof STATUS_COLORS;
  size?: number;
}) {
  const image = src ?? (isPlaceholder(profile.avatar) ? "" : profile.avatar);
  const [burst, triggerBurst] = useClickBurst(easterEggs.avatarClicks);
  const seenBurst = useRef(0);

  useEffect(() => {
    if (burst > seenBurst.current) {
      seenBurst.current = burst;
      toast(easterEggs.avatarBurstMessage);
    }
  }, [burst]);

  const onClick = () => {
    if (!easterEggs.enabled) return;
    triggerBurst();
  };

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/*
        Halo, kept tight. The portrait is a light manga panel on a near-black
        page, so it needs *some* glow to separate from the ground — but a wide
        soft bloom behind a circle is the default every avatar treatment uses,
        and at this size it was doing more fog than form.
      */}
      <span
        className="pointer-events-none absolute -inset-4 rounded-full opacity-60 blur-2xl"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 68%)" }}
        aria-hidden="true"
      />

      {/* expanding burst rings (avatar easter egg) */}
      {burst > 0 && (
        <span key={`burst-${burst}`} className="pointer-events-none absolute inset-0" aria-hidden="true">
          {[0, 120, 240].map((delay) => (
            <span
              key={delay}
              className="absolute inset-0 rounded-full border border-white/40"
              style={{ animation: `burst 1.2s ease-out ${delay}ms both` }}
            />
          ))}
        </span>
      )}

      {/*
        Two concentric hairlines where three animated rings used to be: a slow
        outward pulse and a spinning conic sweep. Those are the two effects every
        template avatar wears, and they were competing with the arcs behind the
        page. Concentric rings echo those arcs at the avatar's own scale, so the
        portrait reads as the centre of the same instrument.
      */}
      <span className="pointer-events-none absolute inset-[-8px] rounded-full border border-white/14" aria-hidden="true" />
      <span className="pointer-events-none absolute inset-[-16px] rounded-full border border-white/7" aria-hidden="true" />

      <div
        className="group relative grid place-items-center rounded-full anim-float"
        style={{ width: size, height: size }}
      >
        <button
          type="button"
          onClick={onClick}
          /* Names what the control does, not just what it depicts. */
          aria-label={`${profile.name} avatar — reveals a hidden effect`}
          data-cursor="hover"
          className="relative h-full w-full overflow-hidden rounded-full border border-white/20 transition-transform duration-700 ease-out will-change-transform hover:scale-[1.035] active:scale-[0.98]"
          style={{ boxShadow: "0 24px 70px -30px rgba(0,0,0,1), inset 0 0 0 1px rgba(255,255,255,0.22)" }}
        >
          {image ? (
            <img
              src={image}
              alt=""
              width={size}
              height={size}
              loading="eager"
              decoding="async"
              /* Above the fold and preloaded in index.html — hint it as critical. */
              fetchPriority="high"
              className="h-full w-full object-cover"
              style={{
                objectPosition: profile.avatarFocus,
                // Higher contrast + brightness suits the manga ink-on-white style.
                filter: "grayscale(1) contrast(1.18) brightness(0.96)",
              }}
            />
          ) : (
            <span
              className="grid h-full w-full place-items-center font-display text-2xl text-white/70"
              style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))" }}
            >
              {profile.name.slice(0, 1)}
            </span>
          )}

          {/* glass sheen + hover sweep */}
          <span
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.22), transparent 45%, rgba(255,255,255,0.06))" }}
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.35), transparent)",
              animation: "shimmer 1.6s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
        </button>

        {/* status dot */}
        <span
          className="absolute bottom-[6%] right-[6%] h-3.5 w-3.5 rounded-full border-2 border-[#08090b]"
          style={{ background: STATUS_COLORS[status] ?? STATUS_COLORS.online }}
          title={`Discord: ${status}`}
          aria-hidden="true"
        />
      </div>

    </div>
  );
}
