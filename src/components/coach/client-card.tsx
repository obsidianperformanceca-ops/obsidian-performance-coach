import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils/cn";
import { formatDistanceToNow } from "date-fns";

const GOAL_LABEL: Record<string, string> = {
  FAT_LOSS: "Fat Loss",
  MUSCLE_GAIN: "Muscle Gain",
  RECOMP: "Recomp",
  MAINTENANCE: "Maintenance",
  PERFORMANCE: "Performance",
  GENERAL_HEALTH: "General Health",
};

export interface ClientCardData {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  currentWeightKg: number | null;
  weeklyChangeKg: number | null;
  goal: string | null;
  calories: number | null;
  proteinG: number | null;
  lastCheckIn: string | null;
  complianceScore: number; // 0-100
  status: string;
}

export function ClientCard({ client }: { client: ClientCardData }) {
  const daysSinceCheckIn = client.lastCheckIn
    ? Math.floor((Date.now() - new Date(client.lastCheckIn).getTime()) / 86_400_000)
    : null;
  const atRisk = daysSinceCheckIn === null || daysSinceCheckIn >= 3;

  return (
    <Link href={`/coach/clients/${client.id}`}>
      <Card className="card-hover cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={client.fullName} src={client.avatarUrl} />
            <div>
              <p className="text-sm font-medium text-foreground">{client.fullName}</p>
              <p className="text-xs text-subtle">
                {client.goal ? GOAL_LABEL[client.goal] ?? client.goal : "No goal set"}
              </p>
            </div>
          </div>
          {atRisk && <Badge tone="danger">At risk</Badge>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-subtle">Weight</p>
            <p className="font-medium text-foreground">
              {client.currentWeightKg ? `${client.currentWeightKg} kg` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-subtle">Weekly change</p>
            <p
              className={cn(
                "font-medium",
                client.weeklyChangeKg == null
                  ? "text-foreground"
                  : client.weeklyChangeKg < 0
                    ? "text-success"
                    : client.weeklyChangeKg > 0
                      ? "text-warning"
                      : "text-foreground"
              )}
            >
              {client.weeklyChangeKg != null
                ? `${client.weeklyChangeKg > 0 ? "+" : ""}${client.weeklyChangeKg} kg`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-subtle">Calories</p>
            <p className="font-medium text-foreground">{client.calories ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-subtle">Protein</p>
            <p className="font-medium text-foreground">
              {client.proteinG ? `${client.proteinG}g` : "—"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-subtle">
          <span>
            {client.lastCheckIn
              ? `Checked in ${formatDistanceToNow(new Date(client.lastCheckIn), { addSuffix: true })}`
              : "Never checked in"}
          </span>
          <span>{client.complianceScore}% compliant</span>
        </div>
        <ProgressBar value={client.complianceScore} className="mt-2" />
      </Card>
    </Link>
  );
}
