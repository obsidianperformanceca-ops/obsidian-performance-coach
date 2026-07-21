import { cn } from "@/lib/utils/cn";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div
        className="h-full rounded-full bg-accent transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
