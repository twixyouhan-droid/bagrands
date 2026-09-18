import { useEffect, useRef } from "react";
import { frameSubscribers, onFrame } from "../lib/ticker";

/**
 * Tiny frame-rate readout, bottom-right. Shows with `?fps` in the URL (or
 * `effects.fpsMeter`). It reads the same shared ticker every layer runs on,
 * so the number is the real page frame rate, not a separate loop's.
 *
 * Note the ceiling: a browser can only paint once per display refresh, so a
 * 60 Hz screen tops out at 60, 144 Hz at 144, and so on. This tells you
 * whether the page is *holding* that ceiling.
 */
export function FpsMeter() {
  const el = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let frames = 0;
    let acc = 0;
    let worst = 0;
    return onFrame((dt) => {
      frames += 1;
      acc += dt;
      worst = Math.max(worst, dt);
      if (acc >= 500) {
        const fps = Math.round((frames * 1000) / acc);
        if (el.current) {
          el.current.textContent = `${fps} fps · ${worst.toFixed(1)} ms worst · ${frameSubscribers()} loops`;
        }
        frames = 0;
        acc = 0;
        worst = 0;
      }
    });
  }, []);

  return (
    <div
      ref={el}
      className="pointer-events-none fixed bottom-3 right-3 z-[90] rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] tabular-nums text-white/80"
      aria-hidden="true"
    >
      — fps
    </div>
  );
}
