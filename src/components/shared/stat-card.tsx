import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  trend,
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted">{label}</p>
        {icon && <div className="text-subtle">{icon}</div>}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {sublabel && (
        <p
          className={cn(
            "mt-1 text-xs",
            trend === "up" && "text-success",
            trend === "down" && "text-danger",
            (!trend || trend === "neutral") && "text-subtle"
          )}
        >
          {sublabel}
        </p>
      )}
    </Card>
  );
}
