import { useMemo } from "react";
import { background as bgConfig } from "../config/profile";
import { useIsMobile, usePrefersReducedMotion } from "../lib/hooks";

interface Flake {
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  opacity: number;
}

/**
 * Foreground snow / dust. Plain CSS-animated spans (no canvas), so it costs
 * almost nothing and never fights the WebGL layer for the main thread.
 */
export function Snow() {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();

  const flakes = useMemo<Flake[]>(() => {
    const count = mobile ? Math.round(bgConfig.particles * 0.45) : bgConfig.particles;
    return Array.from({ length: count }, (_, i) => {
      const seed = (i * 9301 + 49297) % 233280; // deterministic pseudo-random
      const rnd = seed / 233280;
      const rnd2 = ((i * 4523 + 1234) % 9973) / 9973;
      return {
        left: rnd * 100,
        size: mobile ? 1.5 + rnd2 * 2.5 : 2 + rnd2 * 3.6,
        delay: rnd2 * 18,
        duration: 16 + rnd * 20,
        drift: (rnd2 - 0.5) * 140,
        opacity: 0.22 + rnd2 * 0.5,
      };
    });
  }, [mobile]);

  if (reduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[3] overflow-hidden" aria-hidden="true">
      {flakes.map((flake, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-full bg-white"
          style={{
            left: `${flake.left}%`,
            width: flake.size,
            height: flake.size,
            filter: "blur(0.3px)",
            boxShadow: "0 0 6px rgba(255,255,255,0.55)",
            animation: `snow ${flake.duration}s linear ${flake.delay}s infinite`,
            ["--drift" as string]: `${flake.drift}px`,
            ["--flake-opacity" as string]: `${flake.opacity}`,
          }}
        />
      ))}
    </div>
  );
}
