import { requireClient } from "@/lib/auth/session";
import { getOrCreateTodayLog } from "@/lib/db/daily-logs";
import { PageHeader } from "@/components/shared/page-header";
import { CheckInForm } from "@/components/client/checkin-form";
import { format } from "date-fns";

export default async function CheckInPage() {
  const { client } = await requireClient();
  const todayLog = await getOrCreateTodayLog(client.id);

  return (
    <div>
      <PageHeader title="Daily Check-in" description={format(new Date(), "EEEE, MMMM d")} />
      <CheckInForm log={todayLog} unit={client.unit_preference} />
    </div>
  );
}
