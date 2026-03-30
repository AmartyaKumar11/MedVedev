"use client";

import * as React from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AudioUploadCard({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white/85">{label}</div>
          <div className="mt-1 text-xs text-white/45">
            Upload a recording (.wav, .mp3, .m4a)
          </div>
        </div>
        <div
          className={cn(
            "text-[11px] tracking-[0.18em] rounded-full px-3 py-1 border",
            file
              ? "border-white/18 text-white/70 bg-white/6"
              : "border-white/10 text-white/40 bg-white/4",
          )}
        >
          {file ? "READY" : "EMPTY"}
        </div>
      </div>

      <div className="mt-4">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            Choose audio file
          </Button>
          <div className="min-w-0 text-xs text-white/45">
            <div className="truncate">
              {file ? file.name : "No file selected"}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={!file}
            onClick={() => onFile(null)}
            className="ml-auto"
          >
            Clear
          </Button>
        </div>
      </div>

      {file ? (
        <div className="mt-3 text-xs text-white/55">
          {file.name} · {Math.max(1, Math.round(file.size / 1024))} KB
        </div>
      ) : (
        <div className="mt-3 text-xs text-white/35">
          No file selected.
        </div>
      )}
    </GlassCard>
  );
}

