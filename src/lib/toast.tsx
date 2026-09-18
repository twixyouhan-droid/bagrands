import { useEffect, useState } from "react";

/** Minimal global toast: `toast("message")` from anywhere. */
let listener: ((message: string) => void) | null = null;

export function toast(message: string) {
  listener?.(message);
}

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);
  const [id, setId] = useState(0);

  useEffect(() => {
    listener = (next: string) => {
      setMessage(next);
      setId((n) => n + 1);
    };
    return () => {
      listener = null;
    };
  }, []);

  useEffect(() => {
    if (message === null) return;
    const timer = window.setTimeout(() => setMessage(null), 3800);
    return () => window.clearTimeout(timer);
  }, [message, id]);

  if (!message) return null;

  return (
    <div
      className="safe-b pointer-events-none fixed left-1/2 z-[95] w-[min(90vw,420px)] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div key={id} className="glass anim-rise rounded-2xl px-4 py-3 text-center text-[12px] text-white/85 md:text-[13px]">
        {message}
      </div>
    </div>
  );
}
