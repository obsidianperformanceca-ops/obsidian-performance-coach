import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground",
        "placeholder:text-subtle outline-none transition-colors",
        "focus:border-accent focus:ring-1 focus:ring-accent/40",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
