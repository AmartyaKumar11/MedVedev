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
  processing,
}: {
  onStart: () => void;
  onStop: () => void;
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

  return (
    <GlassCard className="p-7">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.18em] text-white/40">
            CONSULTATION
          </div>
          <div className="mt-1 text-lg font-semibold text-white/90">
            Live Capture
          </div>
        </div>
        <div
          className={cn(
            "text-[11px] tracking-[0.18em] rounded-full px-3 py-1 border",
            processing
              ? "border-white/16 text-white/55 bg-white/6"
              : recording
                ? "border-white/20 text-white/80 bg-white/8"
                : "border-white/10 text-white/45 bg-white/4",
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
              recording ? "bg-white/10" : "bg-white/6",
            )}
          />
          <button
            type="button"
            aria-label={recording ? "Stop recording" : "Start recording"}
            onClick={recording ? stop : start}
            disabled={processing}
            className={cn(
              "relative h-24 w-24 rounded-full",
              "border border-white/14 bg-white/8 backdrop-blur-xl",
              "shadow-[0_28px_90px_rgba(0,0,0,0.62)]",
              "transition-transform duration-150",
              "active:scale-[0.98]",
              recording ? "animate-pulse" : "hover:scale-[1.02]",
              processing ? "opacity-60 cursor-not-allowed" : "",
            )}
          >
            <div className="mx-auto h-10 w-10 rounded-xl border border-white/14 bg-white/10" />
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
        <div className="ml-auto text-xs text-white/40">
          Subtle motion. No bright accents.
        </div>
      </div>
    </GlassCard>
  );
}

