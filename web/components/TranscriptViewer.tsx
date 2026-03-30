import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import type { TranscriptLine } from "@/lib/api";

export function TranscriptViewer({ lines }: { lines: TranscriptLine[] }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-white/85">Transcript</div>
        <div className="text-[11px] tracking-[0.18em] text-white/40">
          SPEAKER DIARIZATION
        </div>
      </div>
      <div className="mt-4 max-h-[360px] overflow-auto pr-2 space-y-3">
        {lines.length === 0 ? (
          <div className="text-sm text-white/40">
            No transcript yet.
          </div>
        ) : (
          lines.map((l, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-2xl border p-3 backdrop-blur",
                l.speaker === "Doctor"
                  ? "border-white/10 bg-white/6"
                  : "border-white/12 bg-white/7",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs tracking-[0.18em] text-white/45">
                  {l.speaker.toUpperCase()}
                </div>
                <div className="text-xs text-white/35">
                  {typeof l.tsSec === "number" ? `${l.tsSec}s` : ""}
                </div>
              </div>
              <div className="mt-2 text-sm leading-6 text-white/80">
                {l.text}
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

