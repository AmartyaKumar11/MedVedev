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
          "border border-white/10",
          "bg-white/6",
          "backdrop-blur-xl",
          "shadow-[0_24px_70px_rgba(0,0,0,0.55)]",
        ].join(" "),
        className,
      )}
    >
      {children}
    </div>
  );
}

