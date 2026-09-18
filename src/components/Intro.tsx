import { useEffect, useMemo, useRef, useState } from "react";
import { profile } from "../config/profile";
import { useIsMobile, usePrefersReducedMotion } from "../lib/hooks";

type Stage = "loading" | "gate" | "leaving";

const STAR_COUNT = 16;

/**
 * Two beats, kept short:
 *   1. a 1.1s cinematic 0 → 100 counter
 *   2. the near-black "click to enter…" gate that arms audio on click
 */
export function Intro({ onEnter }: { onEnter: () => void }) {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const [stage, setStage] = useState<Stage>("loading");
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => {
        const a = ((i * 7919) % 997) / 997;
        const b = ((i * 104729) % 991) / 991;
        const c = ((i * 6151) % 983) / 983;
        return { left: a * 100, top: b * 100, size: 3 + c * 2, delay: c * 3.2, duration: 2.4 + a * 2.6 };
      }),
    [],
  );

  /* Beat 1 — the counter. */
  useEffect(() => {
    const duration = reduced ? 260 : 1150;
    const t0 = performance.now();
    let settled = false;

    const settle = () => {
      if (settled) return;
      settled = true;
      setProgress(100);
      window.setTimeout(() => setStage("gate"), reduced ? 60 : 240);
    };

    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 2.2);
      setProgress(Math.round(eased * 100));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else settle();
    };
    rafRef.current = requestAnimationFrame(tick);

    /*
      Safety net: if animation frames never arrive (odd embedded webviews,
      suspended renderer), still let the visitor in.
    */
    const bail = window.setTimeout(settle, duration + 1200);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(bail);
    };
  }, [reduced]);

  const enter = () => {
    if (stage === "leaving") return;
    setStage("leaving");
    window.setTimeout(() => onEnter(), reduced ? 120 : 780);
  };

  /* Let Enter / Space work too. */
  useEffect(() => {
    if (stage !== "gate") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        enter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const leaving = stage === "leaving";

  return (
    <div
      className={`fixed inset-0 z-[70] grid place-items-center transition-[opacity,backdrop-filter] duration-[900ms] ease-out ${
        leaving ? "pointer-events-none opacity-0 backdrop-blur-md" : "opacity-100"
      }`}
      /*
        Translucent, not black: the footage and stars are already painted
        underneath, so the gate reads as a veil over the site rather than a
        separate loading screen.
      */
      style={{
        background: "radial-gradient(120% 90% at 50% 45%, rgba(8,8,10,0.55) 0%, rgba(4,4,5,0.72) 60%, rgba(3,3,3,0.86) 100%)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {/* twinkling specks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {stars.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              opacity: 0.35,
              boxShadow: "0 0 8px rgba(255,255,255,0.6)",
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* a ghost of the atmosphere, very dim */}
      <div
        className="pointer-events-none absolute inset-0 fx-fog opacity-40"
        aria-hidden="true"
      />

      {stage === "loading" ? (
        <>
          {/*
            The announcement is kept apart from the counter on purpose. Inside
            an aria-live region a percentage repainted ~60×/s floods a screen
            reader with "43% 44% 45%…"; the visual block below is hidden from
            assistive tech instead, and this announces the state once.
          */}
          <div className="sr-only" role="status" aria-live="polite">
            Loading…
          </div>
          <div aria-hidden="true" className="relative flex w-[min(78vw,320px)] flex-col items-center gap-6">
            <div className="anim-glow-pulse font-display text-[13px] uppercase tracking-[0.62em] text-white/60">
              {profile.name}
            </div>
            <div className="h-px w-full overflow-hidden bg-white/10">
              <div
                className="h-full bg-white/80 transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%`, boxShadow: "0 0 12px rgba(255,255,255,0.7)" }}
              />
            </div>
            <div className="font-mono text-[10px] tabular-nums tracking-[0.35em] text-white/55">
              {progress.toString().padStart(3, "0")}%
            </div>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={enter}
          /*
            Autofocus only where a keyboard is likely. On a phone it hijacks
            the screen reader's cursor for no benefit — the global Enter/Space
            handler below already covers the gate.
          */
          autoFocus={!mobile}
          aria-label="Enter the site"
          className="glass tilt-3d group relative flex flex-col items-center gap-4 rounded-[28px] px-10 py-10 anim-blur-in md:px-16"
        >
          <span className="card-sheen" aria-hidden="true" />
          <span
            className="pointer-events-none absolute h-[190px] w-[190px] rounded-full opacity-60 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 68%)" }}
            aria-hidden="true"
          />
          <span className="anim-glow-pulse relative text-balance text-[15px] tracking-[0.02em] text-white/95 md:text-[17px]">
            click to enter…
          </span>
          <span className="relative text-[9px] uppercase tracking-[0.42em] text-white/60 transition-colors duration-500 group-hover:text-white/95">
            or press enter
          </span>
          {/* Subtle audio hint */}
          <span className="relative mt-1 flex items-center gap-1.5 text-[8px] uppercase tracking-[0.35em] text-white/45 transition-colors duration-500 group-hover:text-white/70" aria-hidden="true">
            <span className="flex h-2.5 items-end gap-[1.5px]">
              {[0, 100, 50].map((d, i) => (
                <span
                  key={i}
                  className="w-[1.5px] rounded-full bg-white/50"
                  style={{ height: "100%", animation: `eq ${700 + i * 80}ms ease-in-out ${d}ms infinite`, transformOrigin: "bottom center" }}
                />
              ))}
            </span>
            sound on
          </span>
        </button>
      )}
    </div>
  );
}
