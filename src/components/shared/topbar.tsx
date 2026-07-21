"use client";

import { useRouter } from "next/navigation";
import { LogOut, Bell } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

export function Topbar({
  name,
  email,
  unreadNotifications = 0,
}: {
  name: string;
  email: string;
  unreadNotifications?: number;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative text-muted hover:text-foreground" aria-label="Notifications">
          <Bell size={18} />
          {unreadNotifications > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2.5">
          <Avatar name={name} size={30} />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none text-foreground">{name}</p>
            <p className="mt-0.5 text-xs text-subtle">{email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-muted hover:text-foreground"
          aria-label="Sign out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
