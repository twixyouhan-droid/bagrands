import { useTypewriter } from "../lib/hooks";

export function Typewriter({
  lines,
  speed = 55,
  enabled = true,
  className = "",
}: {
  lines: readonly string[];
  speed?: number;
  enabled?: boolean;
  className?: string;
}) {
  const text = useTypewriter(lines, speed, enabled);

  return (
    <p className={`font-display text-[15px] tracking-[0.02em] text-white/75 md:text-[17px] ${className}`}>
      <span aria-hidden="true">{text}</span>
      <span className="anim-caret ml-0.5 inline-block text-white/70" aria-hidden="true">
        |
      </span>
      {/*
        Screen readers get the lines as separate items rather than one run-on
        string joined by punctuation they would have to parse.
      */}
      <span className="sr-only">
        {lines.map((line, i) => (
          <span key={`${line}-${i}`} className="block">
            {line}
          </span>
        ))}
      </span>
    </p>
  );
}
