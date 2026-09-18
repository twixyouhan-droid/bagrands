import { profile } from "../config/profile";

export function Footer() {
  return (
    <footer className="relative mx-auto max-w-6xl px-5 pb-12 md:px-8">
      <span
        className="mb-8 block h-px w-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
        aria-hidden="true"
      />
      <div className="flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
        <div>
          <p className="font-display text-[13px] text-white/80" translate="no">
            {profile.name}
          </p>
          <p className="label mt-1.5">{profile.footerNote}</p>
        </div>

        <div className="flex flex-col items-center gap-3 md:items-end">
          <p className="label">
            Press <span className="text-white/85">T</span> for a new mood
          </p>
          <a href="#top" className="btn-ghost px-4 py-2 text-[12px]" data-cursor="hover">
            Back to Top
          </a>
        </div>
      </div>
    </footer>
  );
}
