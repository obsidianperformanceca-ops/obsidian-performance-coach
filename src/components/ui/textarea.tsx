import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground",
        "placeholder:text-subtle outline-none transition-colors resize-y min-h-20",
        "focus:border-accent focus:ring-1 focus:ring-accent/40",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
