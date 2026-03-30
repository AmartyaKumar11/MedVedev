"use client";

import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";

export function Topbar({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <GlassCard className={cn("px-5 py-4 flex items-center justify-between")}>
      <div>
        <div className="text-xs tracking-[0.18em] text-white/40">
          DASHBOARD
        </div>
        <div className="mt-1 text-lg font-semibold text-white/90">{title}</div>
      </div>
      <div className="flex items-center gap-3">{right}</div>
    </GlassCard>
  );
}

