import { sections, stats } from "../config/profile";
import { useCountUp, useInView } from "../lib/hooks";
import { Reveal } from "./Reveal";

function Stat({ value, label, suffix, run }: { value: number; label: string; suffix: string; run: boolean }) {
  const shown = useCountUp(value, run, 1400);
  return (
    <div>
      <p className="font-display text-[30px] font-semibold tabular-nums leading-none tracking-[-0.03em] text-white/95 md:text-[40px]">
        {shown}
        <span className="text-white/50">{suffix}</span>
      </p>
      <p className="label mt-2.5">{label}</p>
    </div>
  );
}

/**
 * Figures sit straight on the ground, separated by one hairline rule. A glass
 * card with an eyebrow label around four numbers is the default stat strip;
 * without the box, the numbers behave like a colophon instead of a feature.
 */
export function Stats() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 });

  if (!sections.statsEnabled) return null;

  return (
    <section className="relative mx-auto max-w-6xl px-5 pb-[clamp(72px,12vh,140px)] md:px-8">
      <h2 className="sr-only">{sections.statsTitle}</h2>
      <Reveal className="border-t border-white/8 pt-9">
        <div ref={ref} className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {stats.map((stat) => (
            <Stat key={stat.label} value={stat.value} label={stat.label} suffix={stat.suffix} run={inView} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
