import { k } from "./motion";
import { onFrame } from "./ticker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ media */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Respects the OS setting — every heavy effect checks this. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True on phones / small tablets. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/** True when a real mouse is available (custom cursor + magnetic effects). */
export function useHasPointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/* --------------------------------------------------------------- storage */

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode — ignore */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/* ----------------------------------------------------------- visibility */

/** Pauses expensive loops when the tab is hidden. */
export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}

/* ------------------------------------------------------------------- raf */

/**
 * Per-frame callback on the site-wide ticker (see lib/ticker.ts). Stops when
 * `enabled` is false and never runs for reduced-motion users; the ticker
 * itself pauses while the tab is hidden.
 */
export function useRaf(callback: (dt: number, elapsed: number) => void, enabled = true) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!enabled || reduced) return;
    return onFrame((dt, elapsed) => cbRef.current(dt, elapsed));
  }, [enabled, reduced]);
}

/* -------------------------------------------------------------- in view */

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.25, rootMargin: "0px 0px -12% 0px" },
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView] as const;
}

/* ----------------------------------------------------------- typewriter */

export function useTypewriter(lines: readonly string[], speed = 55, enabled = true) {
  const [text, setText] = useState("");
  const reduced = usePrefersReducedMotion();
  const linesKey = useMemo(() => lines.join("\u0000"), [lines]);

  useEffect(() => {
    if (!enabled) return;
    if (reduced) {
      setText(lines[0] ?? "");
      return;
    }
    const list = linesKey.split("\u0000");
    if (list.length === 0) return;

    let line = 0;
    let char = 0;
    let deleting = false;
    let timer = 0;

    const step = () => {
      const current = list[line] ?? "";
      if (!deleting) {
        char += 1;
        setText(current.slice(0, char));
        if (char >= current.length) {
          deleting = true;
          timer = window.setTimeout(step, 1900);
          return;
        }
        timer = window.setTimeout(step, speed);
      } else {
        char -= 1;
        setText(current.slice(0, Math.max(char, 0)));
        if (char <= 0) {
          deleting = false;
          line = (line + 1) % list.length;
          timer = window.setTimeout(step, 360);
          return;
        }
        timer = window.setTimeout(step, speed * 0.45);
      }
    };

    timer = window.setTimeout(step, 420);
    return () => window.clearTimeout(timer);
  }, [linesKey, speed, enabled, reduced]);

  return text;
}

/* -------------------------------------------------------------- counter */

/** Eases a number 0 → target once `run` flips true. */
export function useCountUp(target: number, run: boolean, duration = 1500) {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!run) return;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration, reduced]);

  return value;
}

/* ------------------------------------------------------------ magnetic */

/** Pulls an element slightly toward the cursor while hovering it. */
export function useMagnetic<T extends HTMLElement = HTMLAnchorElement>(strength = 8, enabled = true) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();
  const hasPointer = useHasPointer();
  const active = enabled && !reduced && hasPointer;

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    let raf = 0;
    let isAnimating = false;
    const state = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const py = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      target.x = px * strength;
      target.y = py * strength;
    };
    const reset = () => {
      target.x = 0;
      target.y = 0;
    };

    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16.7;
      last = now;
      const f = k(0.14, dt);
      state.x += (target.x - state.x) * f;
      state.y += (target.y - state.y) * f;
      el.style.translate = `${state.x.toFixed(2)}px ${state.y.toFixed(2)}px`;

      // Stop when fully settled back at zero.
      const settled =
        Math.abs(state.x) < 0.01 && Math.abs(state.y) < 0.01 && target.x === 0 && target.y === 0;
      if (settled) {
        isAnimating = false;
        el.style.translate = "";
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (isAnimating) return;
      isAnimating = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", startLoop);
    el.addEventListener("pointerleave", reset);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", startLoop);
      el.removeEventListener("pointerleave", reset);
      el.style.translate = "";
    };
  }, [active, strength]);

  return ref;
}

/* -------------------------------------------------------------- misc */

/** Locks page scroll (used while the intro is up). */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

/** Calls back once per key press when the pressed key matches (ignores typing in fields). */
export function useKeyPress(
  keys: string[],
  handler: (event: KeyboardEvent) => void,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const keyList = useMemo(() => keys.map((k) => k.toLowerCase()), [keys]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing) return;
      if (keyList.includes(event.key.toLowerCase())) handlerRef.current(event);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyList, enabled]);
}

/** Fires a callback when the Konami sequence is entered. */
export function useKonami(onSuccess: () => void, enabled = true) {
  const sequence = useMemo(
    () => [
      "arrowup",
      "arrowup",
      "arrowdown",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "arrowleft",
      "arrowright",
      "b",
      "a",
    ],
    [],
  );
  const index = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === sequence[index.current]) {
        index.current += 1;
        if (index.current === sequence.length) {
          index.current = 0;
          onSuccess();
        }
      } else {
        index.current = key === sequence[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onSuccess, sequence]);
}

/** Small helper for the avatar burst easter egg. */
export function useClickBurst(threshold: number) {
  const count = useRef(0);
  const [burst, setBurst] = useState(0);
  const trigger = useCallback(() => {
    count.current += 1;
    if (count.current >= threshold) {
      count.current = 0;
      setBurst((b) => b + 1);
    }
  }, [threshold]);
  return [burst, trigger] as const;
}
