import { useEffect, useRef } from "react";
import { useHasPointer, usePrefersReducedMotion } from "./hooks";
import { k } from "./motion";

/**
 * 3D tilt + moving glare + dynamic drop shadow, driven by CSS custom properties.
 *
 * The hook only writes five variables on the element:
 *   --rx / --ry   rotation in degrees
 *   --gx / --gy   glare position in %
 *   --hover       0 → 1, used for lift + shadow + glare opacity
 *
 * The actual transform, shadow and glare live in CSS (`.tilt-3d`, `.btn-3d`),
 * so everything stays on the compositor and one hook serves the card, the
 * social icons and the player buttons alike. The rAF loop only runs while the
 * element is hovered or easing back to rest.
 */
export interface Tilt3DOptions {
  /** Max rotation in degrees. */
  max?: number;
  /** Easing factor per frame (0 → 1). Higher = snappier. */
  ease?: number;
  /** Invert rotation direction (for elements that should "push in"). */
  reverse?: boolean;
}

export function useTilt3D<T extends HTMLElement = HTMLDivElement>(
  enabled = true,
  { max = 8, ease = 0.1, reverse = false }: Tilt3DOptions = {},
) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();
  const hasPointer = useHasPointer();
  const active = enabled && !reduced && hasPointer;

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    const target = { rx: 0, ry: 0, gx: 50, gy: 50, hover: 0 };
    const current = { rx: 0, ry: 0, gx: 50, gy: 50, hover: 0 };
    const dir = reverse ? -1 : 1;
    let raf = 0;
    let running = false;

    const write = () => {
      const s = el.style;
      s.setProperty("--rx", `${current.rx.toFixed(3)}deg`);
      s.setProperty("--ry", `${current.ry.toFixed(3)}deg`);
      s.setProperty("--gx", `${current.gx.toFixed(2)}%`);
      s.setProperty("--gy", `${current.gy.toFixed(2)}%`);
      s.setProperty("--hover", current.hover.toFixed(3));
    };

    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16.7;
      last = now;
      const f = k(ease, dt);
      current.rx += (target.rx - current.rx) * f;
      current.ry += (target.ry - current.ry) * f;
      current.gx += (target.gx - current.gx) * f;
      current.gy += (target.gy - current.gy) * f;
      current.hover += (target.hover - current.hover) * f;
      write();

      const settled =
        target.hover === 0 &&
        Math.abs(current.rx) < 0.01 &&
        Math.abs(current.ry) < 0.01 &&
        current.hover < 0.005;
      if (settled) {
        running = false;
        current.rx = current.ry = current.hover = 0;
        current.gx = current.gy = 50;
        write();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0 → 1
      const py = (e.clientY - rect.top) / rect.height;
      target.ry = (px - 0.5) * 2 * max * dir;
      target.rx = -(py - 0.5) * 2 * max * dir;
      target.gx = px * 100;
      target.gy = py * 100;
      target.hover = 1;
      start();
    };
    const onLeave = () => {
      target.rx = 0;
      target.ry = 0;
      target.hover = 0;
      start();
    };

    el.addEventListener("pointerenter", start);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", start);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointercancel", onLeave);
      ["--rx", "--ry", "--gx", "--gy", "--hover"].forEach((v) => el.style.removeProperty(v));
    };
  }, [active, max, ease, reverse]);

  return ref;
}
