import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Eye, MapPin } from "lucide-react";
import { discord as discordConfig, effects, profile, socials } from "../config/profile";
import { useCountUp, useIsMobile, usePrefersReducedMotion, useRaf } from "../lib/hooks";
import { useTilt3D } from "../lib/tilt";
import { pointer } from "../lib/pointer";
import { useLanyard } from "../lib/lanyard";
import { Avatar } from "./Avatar";
import { DiscordCard } from "./DiscordCard";
import { MusicPlayer } from "./MusicPlayer";
import { SocialRow } from "./SocialRow";
import { Typewriter } from "./Typewriter";

/** Locale-aware grouping, so the counter reads "12,540" not "12540". */
const viewFormat = new Intl.NumberFormat();

/** Counts "profile views" locally, the same way link-in-bio sites do. */
function useViews(base: number) {
  // Use a ref so the calculation only runs once — no re-renders from state.
  const viewsRef = useRef<number>(base);
  const [views, setViews] = useState(base);
  useEffect(() => {
    if (viewsRef.current !== base) return; // already ran
    try {
      const key = "twix:views";
      let stored = Number(window.localStorage.getItem(key) ?? "0") || 0;
      if (!window.sessionStorage.getItem("twix:session")) {
        stored += 1;
        window.localStorage.setItem(key, String(stored));
        window.sessionStorage.setItem("twix:session", "1");
      }
      const final = base + stored;
      viewsRef.current = final;
      setViews(final);
    } catch {
      setViews(base);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return views;
}

function Rise({ entered, delay, children, className = "" }: { entered: boolean; delay: number; children: ReactNode; className?: string }) {
  return (
    <div
      className={`${className} ${entered ? "anim-rise" : "opacity-0"}`}
      style={entered ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export function ProfileCard({ entered }: { entered: boolean }) {
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  /* One ref does both: the tilt hook owns the element, the spotlight reads it. */
  const cardRef = useTilt3D<HTMLDivElement>(effects.tilt && entered, { max: 7, ease: 0.09 });

  const presence = useLanyard(discordConfig.userId);
  const views = useViews(effects.viewBase);
  const animatedViews = useCountUp(views, entered && effects.viewCounter, 1600);

  /* Local spotlight coords (viewport → card space). */
  useRaf(() => {
    const el = cardRef.current;
    if (!el || !effects.spotlight) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${(pointer.x - rect.left).toFixed(1)}px`);
    el.style.setProperty("--my", `${(pointer.y - rect.top).toFixed(1)}px`);
  }, entered && !reduced && !mobile);

  const status = presence.data?.discord_status ?? discordConfig.status;

  return (
    <div className="hero-scroll relative w-full max-w-[456px]">
      {/*
        Halo. Kept inside the viewport on narrow screens: at 375px a 40px bleed
        on both sides put 24px of content past the right edge, which is what the
        page-wide overflow-x: hidden was quietly swallowing.
      */}
      <span
        className="pointer-events-none absolute -inset-y-10 inset-x-0 -z-10 rounded-[60px] opacity-60 blur-3xl sm:-inset-x-10"
        style={{ background: "radial-gradient(60% 50% at 50% 30%, rgba(255,255,255,0.10), transparent 70%)" }}
        aria-hidden="true"
      />

      <div
        ref={cardRef}
        className={`glass tilt-3d relative overflow-hidden rounded-[30px] px-4 pb-5 pt-9 sm:px-5 md:px-7 md:pb-6 md:pt-11 ${
          entered ? "anim-enter-card" : "opacity-0"
        }`}
      >
        {/* spotlight + moving glare + top highlight */}
        {effects.spotlight && <div className="pointer-events-none absolute inset-0 fx-spotlight" aria-hidden="true" />}
        {effects.tilt && <div className="tilt-glare" aria-hidden="true" />}
        <span className="card-sheen" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-x-10 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }}
          aria-hidden="true"
        />

        <div className="tilt-layer relative flex flex-col items-center">
          <Rise entered={entered} delay={80}>
            <Avatar src={null} status={status} size={mobile ? 108 : 128} />
          </Rise>

          <Rise entered={entered} delay={200} className="mt-6 w-full">
            <h1
              className={`display-name text-center text-white ${
                effects.chromatic ? "chromatic" : ""
              } text-glow text-[42px] md:text-[56px]`}
            >
              {profile.name}
            </h1>
            {profile.username && (
              <p className="handle mt-2 text-center" translate="no">
                @{profile.username.toLowerCase()}
              </p>
            )}
          </Rise>

          <Rise entered={entered} delay={280} className="mt-3 w-full">
            <div className="flex justify-center">
              <Typewriter lines={profile.typewriterTexts} speed={profile.typewriterSpeed} enabled={entered} />
            </div>
          </Rise>

          <Rise entered={entered} delay={340} className="mt-4 w-full">
            <p className="mx-auto max-w-[36ch] text-balance text-center text-[13px] leading-[1.7] text-white/62 md:text-[13.5px]">
              {profile.bio}
            </p>
          </Rise>

          <Rise entered={entered} delay={400} className="mt-4 w-full">
            <div className="stagger flex flex-wrap items-center justify-center gap-2">
              {profile.location && (
                <span className="chip" style={{ ["--i" as string]: 0 }}>
                  <MapPin size={10} />
                  {profile.location}
                </span>
              )}
              {profile.badges.map((badge, i) => (
                <span key={badge} className="chip" style={{ ["--i" as string]: i + 1 }}>
                  {badge}
                </span>
              ))}
            </div>
          </Rise>

          <Rise entered={entered} delay={470} className="mt-7 w-full">
            <SocialRow links={socials} />
          </Rise>

          <Rise entered={entered} delay={560} className="mt-6 w-full">
            <span
              className="block h-px w-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
              aria-hidden="true"
            />
          </Rise>

          <Rise entered={entered} delay={620} className="mt-5 w-full space-y-2.5">
            <DiscordCard presence={presence.data} live={presence.live} />
            <MusicPlayer spotify={presence.data?.spotify ?? null} live={presence.live} entered={entered} />
          </Rise>

          <Rise entered={entered} delay={700} className="mt-5 w-full">
            <div className="label flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5" title="Profile views">
                <Eye size={11} aria-hidden="true" />
                <span className="tabular-nums">{viewFormat.format(animatedViews)} views</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#3ba55d]" aria-hidden="true" />
                {presence.live ? "connected" : "mysterious"}
              </span>
            </div>
          </Rise>
        </div>
      </div>
    </div>
  );
}
