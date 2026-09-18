import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { About } from "./components/About";
import { AudioDock } from "./components/AudioDock";
import { Backdrop } from "./components/Backdrop";
import { Cursor } from "./components/Cursor";
import { Footer } from "./components/Footer";
import { FpsMeter } from "./components/FpsMeter";
import { Intro } from "./components/Intro";
import { ProfileCard } from "./components/ProfileCard";
import { Projects } from "./components/Projects";
import { Snow } from "./components/Snow";
import { StarField } from "./components/StarField";
import { Stats } from "./components/Stats";
import { Toaster, toast } from "./lib/toast";
import { audio as audioConfig, background as bgConfig, defaultTheme, easterEggs, effects, profile, seo, sections, themes } from "./config/profile";
import type { ThemeKey } from "./config/profile";
import { useAudio } from "./lib/audio";
import { useKeyPress, useKonami, useLocalStorage, usePrefersReducedMotion, useScrollLock } from "./lib/hooks";
import { initPointer } from "./lib/pointer";

/* The WebGL scene is lazy so it never delays the first paint. */
const Scene3D = lazy(() => import("./components/Scene3D"));

type Phase = "loading" | "gate" | "entered";

const themeKeys = Object.keys(themes) as ThemeKey[];

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [theme, setTheme] = useLocalStorage<ThemeKey>("twix:theme", defaultTheme);
  const [scrolled, setScrolled] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const reduced = usePrefersReducedMotion();
  const audio = useAudio();
  const entered = phase === "entered";

  /* ---------------------------------------------------------------- boot */
  useEffect(() => {
    const boot = document.getElementById("boot");
    boot?.remove();
    return initPointer();
  }, []);

  /* ---------------------------------------------------- metadata + theme */
  useEffect(() => {
    document.title = seo.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", seo.description);
  }, []);

  useEffect(() => {
    const palette = themes[theme] ?? themes[defaultTheme];
    const root = document.documentElement;
    root.style.setProperty("--accent", palette.accent);
    root.style.setProperty("--accent-soft", palette.accentSoft);
    root.style.setProperty("--glow", palette.glow);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", seo.themeColor);
  }, [theme]);

  /* ------------------------------------------------------------ entering */
  /* Single-screen mode when nothing lives below the card: no scroll, no hint. */
  const hasBelowFold =
    sections.aboutEnabled || sections.projectsEnabled || sections.statsEnabled || sections.footerEnabled;
  useScrollLock(!entered || !hasBelowFold);

  const enter = useCallback(() => {
    setPhase("entered");
    window.scrollTo({ top: 0, behavior: "auto" });
    if (audioConfig.playOnEnter) {
      // Must happen inside the user gesture chain to satisfy autoplay policies.
      audio.play();
    }
  }, [audio]);

  /* --------------------------------------------------------------- scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ------------------------------------------------------------- shortcut */
  const cycleTheme = useCallback(() => {
    const next = themeKeys[(themeKeys.indexOf(theme) + 1) % themeKeys.length];
    setTheme(next);
    toast(`Theme: ${themes[next].name}`);
  }, [setTheme, theme]);

  const triggerGlitch = useCallback(() => {
    setGlitch(true);
    toast(easterEggs.konamiMessage);
    window.setTimeout(() => setGlitch(false), 900);
  }, []);

  useKeyPress([easterEggs.themeKey], () => {
    if (easterEggs.enabled) cycleTheme();
  }, { enabled: entered && easterEggs.enabled });

  useKeyPress(["m"], () => audio.toggleMute(), { enabled: entered && audio.configured });

  useKeyPress([" "], (event) => {
    const active = document.activeElement as HTMLElement | null;
    const isControl =
      active &&
      (active.tagName === "BUTTON" ||
        active.tagName === "A" ||
        active.tagName === "INPUT" ||
        active.getAttribute("role") === "button" ||
        active.isContentEditable);
    if (isControl) return; // let the focused control handle it
    event.preventDefault();
    audio.toggle();
  }, { enabled: entered && audio.configured });

  useKonami(triggerGlitch, entered && easterEggs.enabled && easterEggs.konami);

  const accent = (themes[theme] ?? themes[defaultTheme]).accent;
  const showFps = effects.fpsMeter || (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("fps"));

  return (
    <div id="top" className="relative min-h-[100svh]">
      {/*
        First stop in the tab order. Without it a keyboard visitor has to walk
        the whole hero (avatar, 12 social icons, Discord, player) to reach the
        About section.
      */}
      <a href="#main" inert={!entered} className="skip-link">
        Skip to content
      </a>

      <Backdrop />
      {bgConfig.stars.enabled && <StarField count={bgConfig.stars.count} parallax={bgConfig.stars.parallax} />}
      <Snow />
      {entered && effects.three && !reduced && (
        <Suspense fallback={null}>
          <Scene3D accent={accent} />
        </Suspense>
      )}

      <Cursor />
      {entered && <AudioDock />}
      {showFps && <FpsMeter />}
      <Toaster />

      {!entered && <Intro onEnter={enter} />}

      {/* corner controls */}
      <div
        /*
          `inert` until entered: the wrapper is faded out behind the gate, and
          a faded-but-focusable button means Tab lands on something nobody can
          see. inert removes it from focus and from the a11y tree at once.
        */
        inert={!entered}
        className={`safe-tr fixed z-50 flex items-center gap-2 transition-opacity duration-700 ${
          entered ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={cycleTheme}
          className="glass grid h-9 w-9 place-items-center rounded-2xl text-white/60 transition-[color,transform] duration-300 hover:text-white active:scale-90"
          aria-label="Change theme"
          title="Change theme (T)"
          data-cursor="hover"
        >
          <Sparkles size={14} />
        </button>
      </div>

      {/*
        inert while the intro is up: the profile is painted underneath the gate
        before it is revealed, so without this a keyboard or screen-reader user
        can reach 20 controls that are still invisible behind the overlay.
      */}
      <main id="main" inert={!entered} className="relative z-10">
        {/* ------------------------------------------------------------ hero */}
        <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 py-[clamp(64px,10vh,120px)]">
          <ProfileCard entered={entered} />

          {/*
            A real anchor, not a JS scroll: the jump lands in the URL as #about,
            works without JavaScript, and keeps Cmd/Ctrl-click. Smoothness comes
            from `scroll-behavior`, which already collapses under reduced motion.
            inert when hidden so a faded-out control is never in the tab order.
          */}
          {hasBelowFold && (
          <a
            href="#about"
            inert={!(entered && !scrolled)}
            className={`label absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 transition-opacity duration-700 hover:text-white/85 ${
              entered && !scrolled ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/*
              The hint lives outside the visible card so it never crowds the profile.
            */}
            <ChevronDown size={14} className="anim-float" aria-hidden="true" />
            <span>{sections.scrollHint}</span>
          </a>
          )}
        </section>

        {hasBelowFold && (
          <div className="below-fold">
            <About />
            <Projects />
            <Stats />
            {sections.footerEnabled && <Footer />}
          </div>
        )}
      </main>

      {/* konami sweep */}
      {glitch && (
        <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden="true">
          <span
            className="absolute inset-y-0 w-1/3"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)",
              animation: "glitch-sweep 900ms ease-out",
            }}
          />
        </div>
      )}

      {/* Visually hidden but crawlable identity block */}
      <span className="sr-only">
        {profile.name} — {profile.typewriterTexts[0]}
      </span>
    </div>
  );
}
