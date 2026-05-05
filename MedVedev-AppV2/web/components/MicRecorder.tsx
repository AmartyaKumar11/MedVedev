"use client";

import * as React from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MicRecorder({
  onStart,
  onStop,
  onCancel,
  processing,
}: {
  onStart: () => void;
  onStop: () => void;
  onCancel?: () => void;
  processing?: boolean;
}) {
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const tRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (tRef.current) window.clearInterval(tRef.current);
    };
  }, []);

  function start() {
    if (processing) return;
    setRecording(true);
    setSeconds(0);
    onStart();
    tRef.current = window.setInterval(
      () => setSeconds((s) => s + 1),
      1000,
    );
  }

  function stop() {
    if (processing) return;
    setRecording(false);
    if (tRef.current) window.clearInterval(tRef.current);
    tRef.current = null;
    onStop();
  }

  function cancel() {
    if (processing) return;
    if (!recording) return;
    setRecording(false);
    setSeconds(0);
    if (tRef.current) window.clearInterval(tRef.current);
    tRef.current = null;
    onCancel?.();
  }

  return (
    <GlassCard className="p-7">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.18em] text-muted-foreground">
            CONSULTATION
          </div>
          <div className="mt-1 text-lg font-semibold text-foreground">
            Live Capture
          </div>
        </div>
        <div
          className={cn(
            "text-[11px] tracking-[0.18em] rounded-full px-3 py-1 border",
            processing
              ? "border-border text-muted-foreground bg-card/70"
              : recording
                ? "border-border text-foreground/90 bg-card/80"
                : "border-border/80 text-muted-foreground bg-card/60",
          )}
        >
          {processing ? "PROCESSING" : recording ? `REC ${fmt(seconds)}` : "IDLE"}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center">
        <div className="relative">
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-2xl",
              recording ? "bg-foreground/10" : "bg-muted/70",
            )}
          />
          <button
            type="button"
            aria-label={recording ? "Stop recording" : "Start recording"}
            onClick={recording ? stop : start}
            disabled={processing}
            className={cn(
              "relative h-24 w-24 rounded-full",
              "border border-border bg-card/80 backdrop-blur-xl",
              "shadow-[0_28px_90px_rgba(0,0,0,0.62)]",
              "transition-transform duration-150",
              "active:scale-[0.98]",
              recording ? "animate-pulse" : "hover:scale-[1.02]",
              processing ? "opacity-60 cursor-not-allowed" : "",
            )}
          >
            <div className="mx-auto h-10 w-10 rounded-xl border border-border bg-foreground/10" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Button
          type="button"
          onClick={start}
          disabled={recording || !!processing}
        >
          Start Recording
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={stop}
          disabled={!recording || !!processing}
        >
          Stop Recording
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={cancel}
            disabled={!recording || !!processing}
          >
            Cancel
          </Button>
        ) : null}
        <div className="ml-auto text-xs text-muted-foreground">
          Subtle motion. No bright accents.
        </div>
      </div>
    </GlassCard>
  );
}

