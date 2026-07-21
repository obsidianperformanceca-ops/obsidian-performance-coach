import { cn } from "@/lib/utils/cn";

export function Avatar({
  name,
  src,
  className,
  size = 36,
}: {
  name: string;
  src?: string | null;
  className?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "flex items-center justify-center rounded-full bg-accent-muted text-accent font-semibold",
        className
      )}
    >
      <span style={{ fontSize: size * 0.4 }}>{initials || "?"}</span>
    </div>
  );
}
