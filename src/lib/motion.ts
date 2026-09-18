/**
 * Frame-rate independent easing.
 *
 * `value += (target - value) * 0.1` feels right at 60 fps and 2.4× snappier
 * at 144 fps, because it runs 2.4× as often. `k(ease, dt)` converts a
 * per-frame factor tuned at 60 fps into the factor for the frame that
 * actually happened, so the motion looks identical on every display.
 */
export function k(ease: number, dtMs: number): number {
  return 1 - Math.pow(1 - ease, dtMs / (1000 / 60));
}

/** `value` eased toward `target` by a 60 fps-tuned factor over `dtMs`. */
export function approach(value: number, target: number, ease: number, dtMs: number): number {
  return value + (target - value) * k(ease, dtMs);
}
