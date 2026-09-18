import { Reveal } from "./Reveal";

/**
 * A section title.
 *
 * Deliberately has no eyebrow above it. A tracked-out all-caps kicker over every
 * heading is template chrome, and it says the same thing as the heading twice
 * ("ABOUT ME" / "quiet on the outside, loud in the code"). Hierarchy on this page
 * comes from size, weight and space instead.
 */
export function SectionHeading({
  kicker,
  title,
  align = "left",
}: {
  /** Optional — only pass this when it carries information the title doesn't. */
  kicker?: string;
  title: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal className={align === "center" ? "text-center" : ""}>
      {kicker && <p className="label mb-2.5">{kicker}</p>}
      <h2 className="max-w-[24ch] text-balance font-display text-[27px] font-semibold leading-[1.12] tracking-[-0.025em] text-white/95 md:text-[36px]">
        {title}
      </h2>
    </Reveal>
  );
}
