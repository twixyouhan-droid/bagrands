import { useEffect, useRef } from "react";
import { effects } from "../config/profile";
import { useHasPointer, usePrefersReducedMotion, useRaf } from "../lib/hooks";
import { k } from "../lib/motion";
import { pointer } from "../lib/pointer";

/**
 * Custom desktop cursor: a crisp dot, a lagging ring, a magnetic pull and a
 * label slot (add `data-cursor-text="view"` to any element).
 * Everything is written straight to the DOM in one rAF loop — no re-renders.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const hasPointer = useHasPointer();
  const reduced = usePrefersReducedMotion();
  const enabled = effects.cursor && hasPointer;

  const state = useRef({
    x: -200,
    y: -200,
    rx: -200,
    ry: -200,
    scale: 1,
    targetScale: 1,
    label: "",
    hover: 0,
    targetHover: 0,
    down: false,
    opacity: 0,
    seen: false,
  });

  useEffect(() => {
    // Never hide the native cursor unless we are actually drawing our own.
    if (!enabled || reduced) {
      document.body.dataset.cursor = "off";
      return;
    }
    document.body.dataset.cursor = "on";

    const onOver = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-cursor], a, button, [role='button'], input, label",
      );
      const s = state.current;
      if (!target) {
        s.targetScale = 1;
        s.targetHover = 0;
        s.label = "";
        return;
      }
      const mode = target.dataset.cursor ?? "hover";
      if (mode === "hide") {
        s.targetScale = 0.2;
        s.targetHover = 0;
      } else {
        s.targetScale = target.dataset.cursorText ? 2.5 : 1.85;
        s.targetHover = 1;
      }
      s.label = target.dataset.cursorText ?? "";
    };

    const onDown = () => {
      state.current.down = true;
    };
    const onUp = () => {
      state.current.down = false;
    };
    const onLeave = () => {
      state.current.opacity = 0;
    };

    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerleave", onLeave);
      document.body.dataset.cursor = "off";
    };
  }, [enabled, reduced]);

  useRaf((dt) => {
    const s = state.current;
    if (!pointer.active) return;
    s.seen = true;
    const fast = k(0.2, dt);
    const soft = k(0.14, dt);
    s.opacity += (1 - s.opacity) * k(0.12, dt);

    s.x = pointer.x;
    s.y = pointer.y;
    s.rx += (s.x - s.rx) * fast;
    s.ry += (s.y - s.ry) * fast;
    s.scale += (s.targetScale - s.scale) * soft;
    s.hover += (s.targetHover - s.hover) * soft;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring) return;

    const squish = s.down ? 0.82 : 1;
    dot.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) translate(-50%, -50%) scale(${(
      (1.2 - s.hover * 0.4) * squish
    ).toFixed(3)})`;
    dot.style.opacity = `${s.opacity * (s.hover > 0.5 ? 0.45 : 1)}`;

    ring.style.transform = `translate3d(${s.rx}px, ${s.ry}px, 0) translate(-50%, -50%) scale(${(s.scale * squish).toFixed(
      3,
    )})`;
    ring.style.opacity = `${s.opacity * (0.4 + s.hover * 0.6)}`;
    ring.style.borderColor = s.hover > 0.5 ? "var(--accent)" : "rgba(255,255,255,0.45)";
    ring.style.background = `rgba(255,255,255,${(s.hover * 0.08).toFixed(3)})`;

    if (label) {
      if (label.textContent !== s.label) label.textContent = s.label;
      label.style.opacity = s.label ? `${Math.min(s.hover, 1)}` : "0";
    }
  }, enabled);

  if (!enabled || reduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] hidden md:block" aria-hidden="true">
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-white"
        style={{ boxShadow: "0 0 10px rgba(255,255,255,0.8)", willChange: "transform" }}
      />
      <div
        ref={ringRef}
        className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full border"
        style={{ willChange: "transform", backdropFilter: "blur(1px)" }}
      >
        <span
          ref={labelRef}
          className="select-none text-[7px] font-medium uppercase tracking-[0.18em] text-white/90"
        />
      </div>
    </div>
  );
}
