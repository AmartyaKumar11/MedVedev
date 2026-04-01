import * as React from "react";

import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        [
          "rounded-2xl",
          "border border-[var(--glass-border)]",
          "bg-[var(--glass-bg)]",
          "backdrop-blur-xl",
          "shadow-[var(--shadow-soft)]",
        ].join(" "),
        className,
      )}
    >
      {children}
    </div>
  );
}

