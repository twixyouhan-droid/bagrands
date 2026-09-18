import { ArrowUpRight } from "lucide-react";
import { effects, projects, sections } from "../config/profile";
import { isPlaceholder } from "../lib/audio";
import { useTilt3D } from "../lib/tilt";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/** Thumbnail, title row, description, tags. */
function ProjectBody({ project, hasLink }: { project: (typeof projects)[number]; hasLink: boolean }) {
  return (
    <>
      {project.image && (
        <span className="relative block h-36 overflow-hidden rounded-2xl border border-white/8">
          {/* Explicit dimensions so adding a thumbnail can never shift layout. */}
          <img
            src={project.image}
            alt=""
            width={480}
            height={270}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover grayscale"
          />
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[17px] font-medium tracking-[-0.01em] text-white/92">{project.title}</h3>
        <span className="flex items-center gap-2">
          {project.status && <span className="label">{project.status}</span>}
          {hasLink && (
            <ArrowUpRight
              size={15}
              className="translate-y-0.5 text-white/45 transition-[transform,color] duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
            />
          )}
        </span>
      </div>

      <p className="text-[12.5px] leading-relaxed text-white/50">{project.description}</p>

      <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
        {project.tags.map((tag) => (
          <li key={tag} className="chip">
            {tag}
          </li>
        ))}
      </ul>
    </>
  );
}

/** One project card — tilts like the profile card, with the same glare. */
function ProjectCard({ project, hasLink }: { project: (typeof projects)[number]; hasLink: boolean }) {
  const ref = useTilt3D<HTMLElement>(effects.tilt, { max: 6, ease: 0.1 });
  const Wrapper = (hasLink ? "a" : "div") as "a";
  return (
    <Wrapper
      ref={ref as React.Ref<HTMLAnchorElement>}
      {...(hasLink
        ? {
            href: project.url,
            target: "_blank",
            rel: "noopener noreferrer",
            "data-cursor-text": "visit",
            "aria-label": `${project.title} — opens in a new tab`,
          }
        : {})}
      className="group glass-soft tilt-3d relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl p-5 transition-[border-color] duration-500 ease-out hover:border-white/22 md:p-6"
    >
      {effects.tilt && <span className="tilt-glare" aria-hidden="true" />}
      <ProjectBody project={project} hasLink={hasLink} />
    </Wrapper>
  );
}

export function Projects() {
  if (!sections.projectsEnabled) return null;

  return (
    <section id="projects" className="relative mx-auto max-w-6xl px-5 pb-[clamp(72px,12vh,140px)] md:px-8">
      <SectionHeading title={sections.projectsTitle} />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {projects.map((project, i) => (
          <Reveal as="li" key={project.title} delay={i * 90}>
            <ProjectCard project={project} hasLink={!isPlaceholder(project.url)} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
