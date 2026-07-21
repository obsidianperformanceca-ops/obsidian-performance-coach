import { requireCoach } from "@/lib/auth/session";
import { getUnreadCount } from "@/lib/db/notifications";
import { generateReminderNotifications } from "@/lib/notifications/generate";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const coach = await requireCoach();

  // Best-effort: refresh reminder notifications for this coach's clients on
  // each dashboard visit. Swap for a real scheduled job in production.
  generateReminderNotifications(coach.id).catch(() => {});

  const unread = await getUnreadCount(coach.id);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="coach" brandLabel="Coach" />
      <div className="flex-1">
        <Topbar name={coach.full_name ?? coach.email} email={coach.email} unreadNotifications={unread} />
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
