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
            "bg-card/70 text-foreground placeholder:text-muted-foreground",
            "border border-input",
            "backdrop-blur",
            "transition-colors duration-150",
            "hover:border-border",
            "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          ].join(" "),
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

