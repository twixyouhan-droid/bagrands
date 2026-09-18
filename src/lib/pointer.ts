/**
 * A single global pointer store.
 *
 * One passive listener for the whole site: components read the mutable state
 * inside their own rAF loop, so mouse movement never triggers a React re-render.
 *
 * CSS vars (--mx/--my/--px/--py) are written lazily inside a single shared rAF
 * callback instead of on every pointermove, keeping the main thread clear.
 */

export const pointer = {
  /** Viewport position in px. */
  x: 0,
  y: 0,
  /** Normalised -1 → 1 from the viewport centre. */
  nx: 0,
  ny: 0,
  /** True once the user has actually moved a mouse / touched the screen. */
  active: false,
};

let cleanup: (() => void) | null = null;
/** Dirty flag — only write CSS vars when the pointer actually moved. */
let dirty = false;

function flushCSSVars() {
  if (!dirty) return;
  dirty = false;
  const root = document.documentElement;
  root.style.setProperty("--mx", `${pointer.x}px`);
  root.style.setProperty("--my", `${pointer.y}px`);
  root.style.setProperty("--px", `${(pointer.nx * 100).toFixed(3)}%`);
  root.style.setProperty("--py", `${(pointer.ny * 100).toFixed(3)}%`);
}

function update(clientX: number, clientY: number) {
  pointer.x = clientX;
  pointer.y = clientY;
  pointer.nx = (clientX / window.innerWidth) * 2 - 1;
  pointer.ny = (clientY / window.innerHeight) * 2 - 1;
  pointer.active = true;
  dirty = true;
}

let rafId = 0;
function scheduleFlush() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    flushCSSVars();
  });
}

/** Attach the global listeners. Safe to call twice — it is idempotent. */
export function initPointer(): () => void {
  if (cleanup) return cleanup;
  if (typeof window === "undefined") return () => {};

  pointer.x = window.innerWidth / 2;
  pointer.y = window.innerHeight * 0.4;
  dirty = true;
  scheduleFlush();

  const onMove = (e: PointerEvent) => {
    update(e.clientX, e.clientY);
    scheduleFlush();
  };
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) {
      update(t.clientX, t.clientY);
      scheduleFlush();
    }
  };
  const onLeave = () => {
    pointer.nx = 0;
    pointer.ny = 0;
    dirty = true;
    scheduleFlush();
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });
  window.addEventListener("pointerleave", onLeave, { passive: true });
  window.addEventListener("blur", onLeave);

  cleanup = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("touchmove", onTouch);
    window.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("blur", onLeave);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    cleanup = null;
  };
  return cleanup;
}
