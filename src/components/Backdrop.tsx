import { useEffect, useMemo, useRef } from "react";
import { background as bgConfig, effects } from "../config/profile";
import { useIsMobile, usePrefersReducedMotion, useRaf } from "../lib/hooks";
import { pointer } from "../lib/pointer";
import { isPlaceholder } from "../lib/audio";

/**
 * Depth-layered background:
 *   base → atmosphere plate → fog → moonlight → light rays
 * Each layer drifts at a different speed with the pointer, which is what makes
 * the scene feel three-dimensional. All of it is GPU transforms only.
 */
export function Backdrop() {
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();

  /* Where the atmosphere sits, so it never fights the centred profile card. */
  /* Video is optional, skipped for reduced-motion users and (by default) phones. */
  const videoEnabled =
    bgConfig.video.enabled &&
    !reduced &&
    !(mobile && bgConfig.video.desktopOnly) &&
    !isPlaceholder(bgConfig.video.src);

  /*
    Memoize style calculations — these only change when config changes, not on
    every render.

    The mask runs the full 0 → 100% instead of stopping at a hard percentage.
    With a stop at 74% the plate's own bright paper-white areas stayed visible
    right up to the mask boundary, and that boundary is an ellipse: at the top of
    the frame it cut across at x ≈ 480 and left a lit, curve-edged patch hanging
    over the profile card — a shadowless grey disc that read as a broken render.
    Fading all the way out removes the edge itself, whatever the artwork does.
  */
  const { anchor, maskImage } = useMemo(() => {
    const anchor =
      bgConfig.imageAnchor === "left" ? "18% 40%" : bgConfig.imageAnchor === "right" ? "84% 38%" : "50% 36%";
    const maskImage =
      bgConfig.imageAnchor === "center"
        ? "radial-gradient(52% 62% at 50% 40%, #000 0%, transparent 100%)"
        : bgConfig.imageAnchor === "left"
          ? "radial-gradient(46% 58% at 14% 44%, #000 0%, transparent 100%)"
          : "radial-gradient(46% 58% at 88% 42%, #000 0%, transparent 100%)";
    return { anchor, maskImage };
  }, []);

  const root = useRef<HTMLDivElement | null>(null);
  const plate = useRef<HTMLDivElement | null>(null);
  const fog = useRef<HTMLDivElement | null>(null);
  const moon = useRef<HTMLDivElement | null>(null);
  const rays = useRef<HTMLDivElement | null>(null);
  const video = useRef<HTMLDivElement | null>(null);
  const clip = useRef<HTMLVideoElement | null>(null);

  /*
    Muted autoplay is allowed everywhere, but a few browsers (and data-saver
    modes) still hold the clip until the visitor interacts. The gate click is
    that interaction — retry play() on the first pointer / key.
  */
  useEffect(() => {
    if (!videoEnabled) return;
    const kick = () => {
      const el = clip.current;
      if (el && el.paused) el.play().catch(() => {});
    };
    kick();
    window.addEventListener("pointerdown", kick, { once: true, passive: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, [videoEnabled]);

  useRaf(() => {
    /*
      Room light, kept a margin in from every edge. The pointer is very often
      at, or past, the edge of the window — and a radial gradient centred there
      gets sliced by the frame, which reads as a bright disc sitting against the
      profile card rather than as light in a room. Inset, it never gets cut, and
      it stops moving before the extreme it can't reach anyway.
    */
    const stage = root.current;
    if (stage) {
      const padX = window.innerWidth * 0.15;
      const padY = window.innerHeight * 0.15;
      const lx = Math.min(Math.max(pointer.x, padX), window.innerWidth - padX);
      const ly = Math.min(Math.max(pointer.y, padY), window.innerHeight - padY);
      stage.style.setProperty("--mx", `${lx.toFixed(1)}px`);
      stage.style.setProperty("--my", `${ly.toFixed(1)}px`);
    }

    const depth = reduced || mobile ? 0.45 : 1;
    const strength = bgConfig.parallax * depth;
    const apply = (el: HTMLDivElement | null, factor: number) => {
      if (!el) return;
      el.style.transform = `translate3d(${(-pointer.nx * strength * factor).toFixed(2)}px, ${(
        -pointer.ny * strength * factor
      ).toFixed(2)}px, 0)`;
    };
    apply(plate.current, 1);
    apply(video.current, 0.7);
    apply(fog.current, 0.5);
    apply(moon.current, 0.28);
    apply(rays.current, 0.9);
  }, true);

  return (
    // contain:strict isolates this subtree in its own compositor layer so
    // transforms on child layers don't trigger full-page repaints.
    <div
      ref={root}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
      style={{ contain: "strict" }}
    >
      {/*
        1 ── base wash
        Light from above, as a straight falloff rather than a radial hotspot. The
        radial version put the brightest point of the whole page at 50% / -10% —
        directly above the profile card — and with the vignette darkening around
        it and the grain texturing it, that circle read as a grey sphere hanging
        over the profile. The offset moonlight layers below do the actual lighting.
      */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #131519 0%, #090a0c 34%, #050505 68%, #030303 100%)",
        }}
      />

      {/* 2 ── atmosphere plate (additive so the dark parts vanish) */}
      {!isPlaceholder(bgConfig.image) && (
        <div ref={plate} className="absolute -inset-[8%] will-change-transform">
          <div
            className="absolute inset-0 anim-float-slow"
            style={{
              backgroundImage: `url(${bgConfig.image})`,
              backgroundSize: "cover",
              backgroundPosition: anchor,
              opacity: mobile ? bgConfig.imageOpacity * 0.8 : bgConfig.imageOpacity,
              filter: `blur(${bgConfig.imageBlur}px) grayscale(1) contrast(0.85) brightness(0.95)`,
              mixBlendMode: "screen",
              maskImage,
              WebkitMaskImage: maskImage,
            }}
          />
        </div>
      )}

      {/* 3 ── video plate — the moving layer */}
      {videoEnabled && (
        <div ref={video} className="absolute -inset-[4%] will-change-transform">
          <video
            ref={clip}
            className="h-full w-full object-cover object-center"
            src={bgConfig.video.src}
            disablePictureInPicture
            disableRemotePlayback
            poster={bgConfig.video.poster || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            style={{
              opacity: bgConfig.video.opacity,
              /*
                Desaturated to hold the black-and-white world, but exposed
                normally. The old treatment (screen blend + 0.62 brightness +
                blur) crushed the clip into a grey wash — this keeps it legible.
              */
              filter: `grayscale(1) contrast(1.06) brightness(${bgConfig.video.brightness}) blur(${bgConfig.video.blur}px)`,
            }}
          />
          {/*
            A graded scrim rather than a blur: darkest at the top and bottom,
            open across the middle band where the eye reads the movement. It
            keeps the glass card's contrast without hiding the footage.
          */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(5,5,5,${(0.66 * bgConfig.video.scrim).toFixed(3)}) 0%, rgba(5,5,5,${(
                0.26 * bgConfig.video.scrim
              ).toFixed(3)}) 36%, rgba(5,5,5,${(0.34 * bgConfig.video.scrim).toFixed(3)}) 62%, rgba(5,5,5,${(
                0.7 * bgConfig.video.scrim
              ).toFixed(3)}) 100%)`,
            }}
          />
        </div>
      )}

      {/* 4 ── drifting fog */}
      <div
        ref={fog}
        className="absolute -inset-[10%] fx-fog will-change-transform"
        style={{ opacity: bgConfig.fog }}
      />

      {/* 5 ── moonlight (offset from centre so it reads beside the card) */}
      <div ref={moon} className="absolute inset-0 will-change-transform">
        <div
          className="absolute left-[74%] top-[6%] h-[62vh] w-[62vh] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.035) 40%, transparent 70%)",
            filter: "blur(40px)",
            opacity: bgConfig.glow * 0.85,
          }}
        />
        <div
          className="absolute left-[16%] top-[68%] h-[46vh] w-[46vh] -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 66%)",
            filter: "blur(50px)",
            opacity: bgConfig.glow,
          }}
        />
      </div>

      {/* 6 ── light rays (origin set well above the frame so the bands arrive broad) */}
      <div ref={rays} className="absolute -inset-[20%] fx-rays will-change-transform" />

      {/* 7 ── readability + texture */}
      <div className="absolute inset-0 fx-vignette" style={{ opacity: bgConfig.vignette }} />
      {effects.scanlines && <div className="absolute inset-0 fx-scanlines" />}
      {effects.grain && <div className="fx-grain absolute inset-0 overflow-hidden" />}
      <div className="absolute inset-0 fx-room-light" />
    </div>
  );
}
