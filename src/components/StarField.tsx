import { useEffect, useRef } from "react";
import { background as bgConfig } from "../config/profile";
import { useIsMobile, usePrefersReducedMotion } from "../lib/hooks";
import { pointer } from "../lib/pointer";
import { onFrame } from "../lib/ticker";

/**
 * Canvas starfield, three depth layers.
 *
 *  - Each star is pre-rendered once to a small offscreen sprite (radial glow),
 *    so the per-frame cost is a `drawImage` per star — no gradients at runtime.
 *  - Stars drift slowly and wrap; a per-star phase drives the twinkle.
 *  - The pointer offsets each layer by a different amount (parallax). The
 *    offset is eased so fast mouse moves never jolt the field.
 *  - Every 4–9 s a shooting star streaks across; the streak is a stroked line
 *    with a gradient tail, so it costs one draw call.
 *  - Runs on the shared ticker (pauses when hidden) and renders a single
 *    static frame under `prefers-reduced-motion`.
 */
interface Star {
  x: number;
  y: number;
  z: number; // 0 (far) → 1 (near)
  r: number; // sprite radius in px
  phase: number;
  speed: number;
  vx: number;
  vy: number;
  sprite: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0 → 1
  len: number;
}

const LAYERS = [
  { depth: 0.2, share: 0.55, size: [0.6, 1.3], alpha: 0.55 },
  { depth: 0.55, share: 0.32, size: [1.1, 2.0], alpha: 0.8 },
  { depth: 1.0, share: 0.13, size: [1.8, 3.2], alpha: 1 },
] as const;

/** Canvas gradients reject color-mix(), so tint from the hex accent directly. */
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!m) return `rgba(255,255,255,${alpha})`;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function makeSprite(radius: number, tint: string): HTMLCanvasElement {
  const size = Math.ceil(radius * 6);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.85)");
  g.addColorStop(0.45, tint);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

export function StarField({ count = 260, parallax = 28 }: { count?: number; parallax?: number }) {
  const host = useRef<HTMLCanvasElement | null>(null);
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = host.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const total = mobile ? Math.round(count * 0.5) : count;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    let w = 0;
    let h = 0;

    /* Three sprite variants: white, accent-tinted, warm — cheap variety. */
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    const sprites = [
      makeSprite(3, "rgba(255,255,255,0.32)"),
      makeSprite(3, hexToRgba(accent, 0.34)),
      makeSprite(3, "rgba(255,236,210,0.3)"),
    ];

    const stars: Star[] = [];
    const seed = () => {
      stars.length = 0;
      LAYERS.forEach((layer, li) => {
        const n = Math.round(total * layer.share);
        for (let i = 0; i < n; i += 1) {
          const angle = Math.random() * Math.PI * 2;
          const drift = (0.004 + Math.random() * 0.01) * (0.4 + layer.depth);
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            z: layer.depth,
            r: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
            phase: Math.random() * Math.PI * 2,
            speed: 0.6 + Math.random() * 1.6,
            vx: Math.cos(angle) * drift,
            vy: Math.sin(angle) * drift - 0.006 * layer.depth, // gentle upward bias
            sprite: li === 2 && Math.random() < 0.5 ? 1 : Math.random() < 0.15 ? 2 : 0,
          });
        }
      });
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (stars.length === 0) seed();
    };
    resize();

    let elapsed = 0;
    const eased = { x: 0, y: 0 };

    /* ------------------------------------------------------ shooting stars */
    const meteors: Meteor[] = [];
    let nextMeteor = 3 + Math.random() * 4;
    const spawnMeteor = () => {
      const fromLeft = Math.random() < 0.5;
      const speed = 14 + Math.random() * 10;
      const angle = (fromLeft ? 0.35 : Math.PI - 0.35) + (Math.random() - 0.5) * 0.3;
      meteors.push({
        x: fromLeft ? -40 : w + 40,
        y: Math.random() * h * 0.55,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        len: 120 + Math.random() * 120,
      });
    };
    const drawMeteors = (dt: number) => {
      for (let i = meteors.length - 1; i >= 0; i -= 1) {
        const m = meteors[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life += dt * 0.022;
        if (m.life >= 1 || m.x < -200 || m.x > w + 200 || m.y > h + 200) {
          meteors.splice(i, 1);
          continue;
        }
        const fade = Math.sin(m.life * Math.PI); // in → out
        const mag = Math.hypot(m.vx, m.vy) || 1;
        const tx = m.x - (m.vx / mag) * m.len;
        const ty = m.y - (m.vy / mag) * m.len;
        const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
        g.addColorStop(0.3, `rgba(255,255,255,${0.35 * fade})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        /* bright head */
        ctx.globalAlpha = fade;
        ctx.drawImage(sprites[0], m.x - 6, m.y - 6, 12, 12);
        ctx.globalAlpha = 1;
      }
    };

    const frame = (dt: number) => {
      /* Ease the parallax target so it never snaps (dt is in 60 fps frames). */
      const f = 1 - Math.pow(1 - 0.045, Math.max(dt, 0.001));
      eased.x += (pointer.nx - eased.x) * f;
      eased.y += (pointer.ny - eased.y) * f;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const margin = 24;
      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < -margin) s.x = w + margin;
        else if (s.x > w + margin) s.x = -margin;
        if (s.y < -margin) s.y = h + margin;
        else if (s.y > h + margin) s.y = -margin;

        const px = s.x - eased.x * parallax * s.z;
        const py = s.y - eased.y * parallax * s.z;

        /* Twinkle: slow sine + faster shimmer for the near layer. */
        const tw = 0.62 + 0.38 * Math.sin(elapsed * s.speed + s.phase);
        const layerAlpha = LAYERS[s.z === 1 ? 2 : s.z > 0.4 ? 1 : 0].alpha;
        ctx.globalAlpha = tw * layerAlpha;

        const size = s.r * 6;
        ctx.drawImage(sprites[s.sprite], px - size / 2, py - size / 2, size, size);
      }
      ctx.globalAlpha = 1;

      if (dt > 0) {
        nextMeteor -= dt / 60;
        if (nextMeteor <= 0) {
          spawnMeteor();
          nextMeteor = 4 + Math.random() * 5;
        }
        drawMeteors(dt);
      }
      ctx.globalCompositeOperation = "source-over";
    };

    let stop: (() => void) | null = null;
    if (reduced) {
      frame(0);
    } else {
      stop = onFrame((dtMs) => {
        const dt = Math.min(dtMs / 16.667, 4); // in "frames" at 60fps
        elapsed += dt * 0.016;
        frame(dt);
      });
    }

    /* Fade in on the first paint instead of popping. */
    requestAnimationFrame(() => canvas.classList.add("is-ready"));

    window.addEventListener("resize", resize);

    return () => {
      stop?.();
      window.removeEventListener("resize", resize);
    };
  }, [count, parallax, mobile, reduced]);

  return (
    <canvas
      ref={host}
      className="starfield pointer-events-none fixed inset-0 z-[1]"
      aria-hidden="true"
      style={{ ["--star-opacity" as string]: bgConfig.stars.opacity }}
    />
  );
}
