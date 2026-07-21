import Link from "next/link";
import { requireCoach } from "@/lib/auth/session";
import { getCoachAnalytics } from "@/lib/db/analytics";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Percent } from "lucide-react";

export default async function AnalyticsPage() {
  const coach = await requireCoach();
  const data = await getCoachAnalytics(coach.id);

  return (
    <div>
      <PageHeader title="Analytics" description="Roster-wide trends across your active clients." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Avg. monthly weight change"
          value={data.avgMonthlyWeightChangeKg != null ? `${data.avgMonthlyWeightChangeKg > 0 ? "+" : ""}${data.avgMonthlyWeightChangeKg} kg` : "—"}
          icon={<TrendingDown size={16} />}
        />
        <StatCard label="Avg. compliance" value={`${data.avgCompliance}%`} icon={<Percent size={16} />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Fastest progressing clients</CardTitle></CardHeader>
          {data.fastestProgressing.length === 0 ? (
            <p className="text-sm text-muted">Not enough weight data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.fastestProgressing.map((c) => (
                <Link
                  key={c.clientId}
                  href={`/coach/clients/${c.clientId}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-2"
                >
                  <span className="text-sm text-foreground">{c.fullName}</span>
                  <span className="text-sm text-muted">
                    {c.monthlyChangeKg! > 0 ? "+" : ""}
                    {c.monthlyChangeKg} kg / mo
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Clients at risk</CardTitle></CardHeader>
          {data.atRisk.length === 0 ? (
            <p className="text-sm text-muted">Everyone is checking in on time.</p>
          ) : (
            <div className="space-y-2">
              {data.atRisk.map((c) => (
                <Link
                  key={c.clientId}
                  href={`/coach/clients/${c.clientId}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-2"
                >
                  <span className="text-sm text-foreground">{c.fullName}</span>
                  <Badge tone="danger">
                    {c.daysSinceCheckIn == null ? "Never checked in" : `${c.daysSinceCheckIn}d ago`}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>All active clients</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-subtle">
                <th className="pb-2 font-medium">Client</th>
                <th className="pb-2 font-medium">Monthly change</th>
                <th className="pb-2 font-medium">Compliance</th>
                <th className="pb-2 font-medium">Last check-in</th>
              </tr>
            </thead>
            <tbody>
              {data.perClient.map((c) => (
                <tr key={c.clientId} className="border-b border-border last:border-0">
                  <td className="py-2">
                    <Link href={`/coach/clients/${c.clientId}`} className="text-foreground hover:text-accent">
                      {c.fullName}
                    </Link>
                  </td>
                  <td className="py-2 text-muted">
                    {c.monthlyChangeKg != null ? `${c.monthlyChangeKg > 0 ? "+" : ""}${c.monthlyChangeKg} kg` : "—"}
                  </td>
                  <td className="py-2 text-muted">{c.complianceScore}%</td>
                  <td className="py-2 text-muted">
                    {c.daysSinceCheckIn == null ? "Never" : `${c.daysSinceCheckIn}d ago`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
