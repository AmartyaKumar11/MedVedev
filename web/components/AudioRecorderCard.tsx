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
  teleprompterScript,
}: {
  label: string;
  file: File | null;
  onFile: (file: File | null) => void;
  teleprompterScript?: string;
}) {
  const [status, setStatus] = React.useState<RecStatus>("idle");
  const [seconds, setSeconds] = React.useState(0);
  const [teleprompterOpen, setTeleprompterOpen] = React.useState(false);
  const [recordingError, setRecordingError] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const timerRef = React.useRef<number | null>(null);
  const targetSeconds = 60;
  const progressPct = Math.min(100, Math.round((seconds / targetSeconds) * 100));

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
    setRecordingError(null);
    setSeconds(0);
    chunksRef.current = [];

    try {
      const isSecure =
        window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!isSecure) {
        setRecordingError("Microphone recording requires HTTPS (or localhost).");
        return;
      }

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
        setTeleprompterOpen(false);
      };

      mr.start();
      setStatus("recording");
      setTeleprompterOpen(true);
      timerRef.current = window.setInterval(
        () => setSeconds((s) => s + 1),
        1000,
      );
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Unable to start recording.";
      setRecordingError(`Recording failed: ${msg}`);
      setStatus("idle");
      setTeleprompterOpen(false);
    }
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

      {recordingError ? (
        <div className="mt-3 text-xs text-white/65">{recordingError}</div>
      ) : null}

      {teleprompterOpen && teleprompterScript ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4">
          <GlassCard className="w-full max-w-3xl border-white/15 bg-[#111111]/85 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] tracking-[0.22em] text-white/45">TELEPROMPTER</div>
                <div className="mt-1 text-sm text-white/75">
                  {label} - read naturally while recording.
                </div>
              </div>
              <Button type="button" variant="outline" onClick={stop}>
                Stop
              </Button>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-white/55">
                <span>Progress</span>
                <span>
                  {formatTime(seconds)} / {formatTime(targetSeconds)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/8">
                <div
                  className="h-full bg-white/80 transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="mt-4 max-h-[48vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/6 p-4">
              <pre className="whitespace-pre-wrap text-sm leading-6 text-white/80">
                {teleprompterScript}
              </pre>
            </div>
          </GlassCard>
        </div>
      ) : null}
    </GlassCard>
  );
}

