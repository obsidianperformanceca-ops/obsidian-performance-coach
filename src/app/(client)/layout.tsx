import { requireClient } from "@/lib/auth/session";
import { getUnreadCount } from "@/lib/db/notifications";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireClient();
  const unread = await getUnreadCount(user.id);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="client" brandLabel="Coach" />
      <div className="flex-1">
        <Topbar name={user.full_name ?? user.email} email={user.email} unreadNotifications={unread} />
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
