"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Users,
  ClipboardCheck,
  Dumbbell,
  TrendingUp,
  UserCircle,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Defined here (inside a Client Component) rather than passed in as a prop
// from a Server Component layout, because lucide icon components are not
// serializable across the RSC server/client boundary.
const NAV_ITEMS_BY_ROLE: Record<"coach" | "client", NavItem[]> = {
  coach: [
    { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/coach/clients", label: "Clients", icon: Users },
    { href: "/coach/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/coach/messages", label: "Messages", icon: MessageSquare },
  ],
  client: [
    { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/client/checkin", label: "Daily Check-in", icon: ClipboardCheck },
    { href: "/client/workouts", label: "Workouts", icon: Dumbbell },
    { href: "/client/progress", label: "Progress", icon: TrendingUp },
    { href: "/client/messages", label: "Messages", icon: MessageSquare },
    { href: "/client/profile", label: "Profile", icon: UserCircle },
  ],
};

export function Sidebar({
  role,
  brandLabel,
}: {
  role: "coach" | "client";
  brandLabel: string;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS_BY_ROLE[role];

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="text-sm font-semibold tracking-tight text-foreground">Obsidian</span>
        <span className="text-sm text-muted">{brandLabel}</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-muted text-accent"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
