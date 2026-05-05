import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import type { TranscriptLine } from "@/lib/api";

export function TranscriptViewer({ lines }: { lines: TranscriptLine[] }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">Transcript</div>
        <div className="text-[11px] tracking-[0.18em] text-muted-foreground">
          SPEAKER DIARIZATION
        </div>
      </div>
      <div className="mt-4 max-h-[360px] overflow-auto pr-2 space-y-3">
        {lines.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No transcript yet.
          </div>
        ) : (
          lines.map((l, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-2xl border p-3 backdrop-blur",
                l.speaker === "Doctor"
                  ? "border-border bg-card/70"
                  : "border-border bg-card/85",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs tracking-[0.18em] text-muted-foreground">
                  {l.speaker.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {typeof l.tsSec === "number" ? `${l.tsSec}s` : ""}
                </div>
              </div>
              <div className="mt-2 text-sm leading-6 text-foreground/90">
                {l.text}
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

