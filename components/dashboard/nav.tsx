"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  IndianRupee,
  Zap,
} from "lucide-react";

const routes = [
  {
    label: "Overview",
    icon: Home,
    href: "/dashboard",
    exact: true,
  },
  {
    label: "Renters",
    icon: Users,
    href: "/dashboard/renters",
  },
  {
    label: "Monthly Rent",
    icon: IndianRupee,
    href: "/dashboard/payments/rent",
  },
  {
    label: "Electricity Rent",
    icon: Zap,
    href: "/dashboard/payments/electricity",
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-4 py-4">
      {routes.map((route) => {
        const Icon = route.icon;
        const isActive = route.exact
          ? pathname === route.href
          : pathname.startsWith(route.href);

        return (
          <Link key={route.href} href={route.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{route.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
