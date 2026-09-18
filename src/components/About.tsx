import { about, sections } from "../config/profile";
import { useInView } from "../lib/hooks";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const titles = sections.aboutCardTitles;

/**
 * One entry in the dossier.
 *
 * These are label/value facts about a person, which is why <dl> is the right
 * structure here and why the labels earn their place — they carry information
 * instead of decorating a box. No box: a hairline separates one fact from the
 * next, so the section reads as a profile rather than a row of widgets.
 */
function Field({ label, children, delay = 0 }: { label: string; children: React.ReactNode; delay?: number }) {
  return (
    <Reveal
      delay={delay}
      className="grid gap-2.5 border-t border-white/8 py-6 first:border-t-0 first:pt-0 sm:grid-cols-[132px_1fr] sm:gap-6"
    >
      <dt className="label pt-0.5">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </Reveal>
  );
}

/** Values, not labels — sentence case, quiet, no pills shouting. */
function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className="chip">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function About() {
  const [skillsRef, skillsInView] = useInView<HTMLDivElement>();

  if (!sections.aboutEnabled) return null;

  return (
    <section id="about" className="relative mx-auto max-w-6xl px-5 py-[clamp(72px,12vh,140px)] md:px-8">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <SectionHeading title={about.title} />

          <Reveal delay={120} className="mt-7 space-y-4">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph} className="max-w-[58ch] text-[13.5px] leading-[1.85] text-white/68 md:text-[14.5px]">
                {paragraph}
              </p>
            ))}
          </Reveal>

          <Reveal delay={200} className="mt-8">
            <p className="label mb-3">{titles.interests}</p>
            <Chips items={about.interests} />
          </Reveal>
        </div>

        <dl className="self-start">
          <Field label={titles.games} delay={80}>
            <ul className="space-y-1.5 text-[13px] text-white/72">
              {about.games.map((game) => (
                <li key={game} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden="true" />
                  {game}
                </li>
              ))}
            </ul>
          </Field>

          <Field label={titles.music} delay={120}>
            <Chips items={about.music} />
          </Field>

          <Field label={titles.now} delay={160}>
            <ul className="space-y-3">
              {about.currentProjects.map((project) => (
                <li key={project.name}>
                  <span className="block text-[13px] text-white/85">{project.name}</span>
                  <span className="label mt-0.5 block">{project.note}</span>
                </li>
              ))}
            </ul>
          </Field>

          <Field label={titles.skills} delay={200}>
            <div ref={skillsRef} className="space-y-3.5">
              {about.skills.map((skill, i) => (
                <div key={skill.name}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[12.5px] text-white/72">{skill.name}</span>
                    <span className="label tabular-nums">{skill.level}%</span>
                  </div>
                  {/* A rule that fills — a progress bar here would be UI chrome. */}
                  <span className="mt-1.5 block h-[2px] w-full bg-white/12">
                    <span
                      className="block h-full bg-white/70 transition-[width] duration-[1400ms] ease-out"
                      style={{ width: skillsInView ? `${skill.level}%` : "0%", transitionDelay: `${i * 120}ms` }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </Field>
        </dl>
      </div>
    </section>
  );
}
