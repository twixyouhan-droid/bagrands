import { Volume2, VolumeX } from "lucide-react";
import { audio as audioConfig } from "../config/profile";
import { useAudio } from "../lib/audio";

/** Top-left volume / mute control with a live equalizer and track name. */
export function AudioDock() {
  const audio = useAudio();
  if (!audioConfig.showDock || !audio.configured) return null;

  const level = Math.round((audio.muted ? 0 : audio.volume) * 100);
  const trackName = audio.current?.title ?? "";

  return (
    <div className="safe-tl fixed z-50">
      <div className="glass flex items-center gap-2.5 rounded-2xl px-2.5 py-2">
        <button
          type="button"
          onClick={audio.toggleMute}
          aria-label={audio.muted ? "Unmute" : "Mute"}
          aria-pressed={audio.muted}
          data-cursor="hover"
          className="grid h-8 w-8 place-items-center rounded-xl text-white/75 transition-[color,background-color,transform] duration-300 hover:bg-white/10 hover:text-white active:scale-90"
        >
          {audio.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={audio.muted ? 0 : audio.volume}
          onChange={(e) => audio.setVolume(Number(e.target.value))}
          /*
            The label names the control; the percentage goes in valuetext.
            Baking the live number into aria-label — "Volume 45%" — makes the
            name change under the user's finger as they drag.
          */
          aria-label="Volume"
          aria-valuetext={`${level}%`}
          className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/15 md:w-24 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.85) ${level}%, rgba(255,255,255,0.12) ${level}%)`,
          }}
        />

        {/* EQ bars */}
        <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
          {[0, 140, 70, 210].map((delay, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full bg-white/60"
              style={{
                height: "100%",
                animation: audio.playing ? `eq ${780 + i * 110}ms ease-in-out ${delay}ms infinite` : "none",
                transform: audio.playing ? undefined : "scaleY(0.2)",
                transformOrigin: "bottom center",
              }}
            />
          ))}
        </span>

        {/* Track name — only shown on desktop if there is one */}
        {trackName && (
          <span
            className="label hidden max-w-[120px] truncate transition-colors duration-300 md:block"
            title={trackName}
          >
            {trackName}
          </span>
        )}
      </div>
    </div>
  );
}
