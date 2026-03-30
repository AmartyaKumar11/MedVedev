import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          [
            "h-11 w-full rounded-2xl px-4",
            "bg-white/6 text-white/90 placeholder:text-white/28",
            "border border-white/10",
            "backdrop-blur",
            "transition-colors duration-150",
            "hover:border-white/14",
            "focus-visible:outline-none focus-visible:border-white/18 focus-visible:ring-2 focus-visible:ring-white/14",
          ].join(" "),
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

