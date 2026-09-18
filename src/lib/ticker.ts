/**
 * One requestAnimationFrame for the whole site.
 *
 * Every animated layer (backdrop parallax, cursor, card spotlight, starfield,
 * WebGL scene) subscribes here instead of owning its own loop. That means one
 * callback per frame from the browser, one shared delta, and one place that
 * pauses everything when the tab is hidden.
 *
 * Subscribers run in registration order; a subscriber that throws is removed
 * so a single broken layer can never stall the rest of the page.
 */
export type FrameFn = (dt: number, elapsed: number, now: number) => void;

const subs = new Set<FrameFn>();
let raf = 0;
let last = 0;
let start = 0;
let hidden = typeof document !== "undefined" && document.hidden;

function loop(now: number) {
  raf = subs.size ? requestAnimationFrame(loop) : 0;
  if (hidden) return;
  /* Clamp so a background tab returning doesn't produce a 3-second step. */
  const dt = Math.min(now - last, 64);
  last = now;
  const elapsed = now - start;
  for (const fn of subs) {
    try {
      fn(dt, elapsed, now);
    } catch (err) {
      subs.delete(fn);
      if (import.meta.env.DEV) console.error("[ticker] subscriber removed after error", err);
    }
  }
}

function ensureRunning() {
  if (raf || !subs.size) return;
  const now = performance.now();
  if (!start) start = now;
  last = now;
  raf = requestAnimationFrame(loop);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    hidden = document.hidden;
    /* Reset the clock so the first frame back isn't a giant delta. */
    if (!hidden) last = performance.now();
  });
}

/** Subscribe to the shared frame. Returns an unsubscribe function. */
export function onFrame(fn: FrameFn): () => void {
  subs.add(fn);
  ensureRunning();
  return () => {
    subs.delete(fn);
    if (!subs.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/** Number of active subscribers — handy in the console when profiling. */
export function frameSubscribers(): number {
  return subs.size;
}
