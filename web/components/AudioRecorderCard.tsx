"use client";

import * as React from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RecStatus = "idle" | "recording" | "stopped" | "unsupported";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioRecorderCard({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const [status, setStatus] = React.useState<RecStatus>("idle");
  const [seconds, setSeconds] = React.useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") mr.stop();
    };
  }, []);

  async function start() {
    if (status === "unsupported") return;
    setSeconds(0);
    chunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
      const f = new File([blob], `${label.replace(/\s+/g, "_")}.webm`, {
        type: blob.type || "audio/webm",
      });
      onFile(f);
      setStatus("stopped");
    };

    mr.start();
    setStatus("recording");
    timerRef.current = window.setInterval(
      () => setSeconds((s) => s + 1),
      1000,
    );
  }

  function stop() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (mr.state !== "inactive") mr.stop();
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white/85">{label}</div>
          <div className="mt-1 text-xs text-white/45">
            Record directly in the browser
          </div>
        </div>

        <div
          className={cn(
            "text-[11px] tracking-[0.18em] rounded-full px-3 py-1 border",
            status === "recording"
              ? "border-white/20 text-white/80 bg-white/8"
              : file
                ? "border-white/18 text-white/70 bg-white/6"
                : "border-white/10 text-white/40 bg-white/4",
          )}
        >
          {status === "unsupported"
            ? "UNAVAILABLE"
            : status === "recording"
              ? `REC ${formatTime(seconds)}`
              : file
                ? "READY"
                : "IDLE"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={status === "unsupported" || status === "recording"}
          onClick={() => void start()}
        >
          Start Recording
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={status !== "recording"}
          onClick={stop}
        >
          Stop
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          disabled={!file}
          onClick={() => onFile(null)}
        >
          Clear
        </Button>
      </div>

      {file ? (
        <div className="mt-3 text-xs text-white/55">
          {file.name} · {Math.max(1, Math.round(file.size / 1024))} KB
        </div>
      ) : (
        <div className="mt-3 text-xs text-white/35">
          {status === "unsupported"
            ? "Recording not supported in this browser."
            : "No recording captured yet."}
        </div>
      )}
    </GlassCard>
  );
}

