import { effects } from "../config/profile";
import type { SocialLink } from "../config/profile";
import { BrowserIcon, brandColor } from "../icons/brands";
import { isPlaceholder } from "../lib/audio";
import { useMagnetic } from "../lib/hooks";
import { useTilt3D } from "../lib/tilt";
import { toast } from "../lib/toast";

function Tooltip({ link, unset }: { link: SocialLink; unset: boolean }) {
  return (
    /*
      Visual only. It repeats what the button's aria-label already says
      ("Discord — link not set yet"), and as a bare role="tooltip" with no
      aria-describedby the two spans would be read as one run-on string.
    */
    <span
      aria-hidden="true"
      className="glass-soft pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-30 hidden -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-[10px] leading-none text-white/90 opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 md:block"
    >
      {/* Brand names are not words to translate. */}
      <span className="font-medium tracking-wide" translate="no">
        {link.name}
      </span>
      <span className="ml-1.5 text-white/45">
        {link.copy ? `copy ${link.copy}` : unset ? "add your link" : link.handle ? link.handle : "open"}
      </span>
    </span>
  );
}

/** Copy to the clipboard with a fallback for insecure contexts (plain http). */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function SocialButton({ link, index }: { link: SocialLink; index: number }) {
  const unset = !link.copy && isPlaceholder(link.url);
  const brand = link.color ?? brandColor(link.brand);
  const ref = useMagnetic<HTMLAnchorElement>(effects.magnetic ? 7 : 0, effects.magnetic);
  /*
    Tilt goes on the wrapper, magnetic pull on the anchor: `translate` and
    `transform` are separate properties, so the two never overwrite each other.
  */
  const tiltRef = useTilt3D<HTMLDivElement>(effects.tilt, { max: 14, ease: 0.16 });

  const shared = {
    className: "social-btn btn-3d group/icon",
    style: { ["--brand" as string]: brand },
    "data-cursor": "hover",
    "aria-label": link.copy
      ? `${link.name} — copy username ${link.copy}`
      : unset
        ? `${link.name} — link not set yet`
        : `${link.name}${link.handle ? ` (${link.handle})` : ""} — opens in a new tab`,
  } as const;

  return (
    <div ref={tiltRef} className="group relative" style={{ ["--i" as string]: index }}>
      {link.copy ? (
        <button
          type="button"
          {...shared}
          onClick={async () => {
            const ok = await copyText(link.copy!);
            toast(ok ? `Copied ${link.copy}` : `${link.name}: ${link.copy}`);
          }}
        >
          <BrowserIcon brand={link.brand} size={19} />
        </button>
      ) : unset ? (
        <button
          type="button"
          {...shared}
          onClick={() =>
            toast(`${link.name}: replace <<< YOUR ${link.name.toUpperCase()} URL >>> in src/config/profile.ts`)
          }
        >
          <BrowserIcon brand={link.brand} size={19} />
          <span className="sr-only">{link.name} (not configured)</span>
        </button>
      ) : (
        <a
          ref={ref}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer me"
          {...shared}
          onClick={(e) => e.stopPropagation()}
        >
          <BrowserIcon brand={link.brand} size={19} />
        </a>
      )}
      <Tooltip link={link} unset={unset} />
    </div>
  );
}

/**
 * Icons per row so the set never ends in a ragged short row: up to 7 fit on
 * one line inside the card; 8 → 4 + 4, 9 → 3 × 3, 10 → 5 + 5, 11–12 → 6 + 6.
 */
function perRow(n: number): number {
  if (n <= 7) return n;
  if (n === 8) return 4;
  if (n === 9) return 3;
  if (n === 10) return 5;
  return 6;
}

export function SocialRow({ links, className = "" }: { links: SocialLink[]; className?: string }) {
  const cols = perRow(links.length);
  /*
    Up to 7 icons: one row, always. On a phone the buttons shrink to fit (down
    to ~38px) rather than wrapping into a ragged 4 + 3 — see .social-fit.
    Larger sets wrap into even rows: 46px buttons + 12px gap from md up,
    capped at 4 per row on phones.
  */
  const fit = links.length <= 7;
  const maxWidth = cols * 46 + (cols - 1) * 12 + 2;
  return (
    <nav
      aria-label="Social links"
      style={{ ["--social-max" as string]: `${maxWidth}px`, ...(fit ? { maxWidth: `min(100%, ${maxWidth}px)` } : null) }}
      className={`stagger flex items-center justify-center gap-2.5 md:gap-3 ${
        fit ? "social-fit w-full flex-nowrap" : "max-w-[226px] flex-wrap sm:max-w-[var(--social-max)]"
      } ${className}`}
    >
      {links.map((link, i) => (
        <SocialButton key={link.name + link.brand} link={link} index={i} />
      ))}
    </nav>
  );
}
