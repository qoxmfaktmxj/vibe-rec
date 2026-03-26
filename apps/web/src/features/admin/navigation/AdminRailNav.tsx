"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function AdminRailNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col items-center gap-3">
      {items.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : item.href === "/admin/applicants"
              ? pathname === "/admin/applicants" ||
                pathname.startsWith("/admin/applicants/")
              : item.href === "/"
                ? pathname === "/"
                : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex h-10 w-10 items-center justify-center rounded-sm border transition-colors ${
              isActive
                ? "border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
                : "border-transparent text-sidebar-foreground/80 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
            title={item.label}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              {item.icon}
            </svg>
          </Link>
        );
      })}
    </nav>
  );
}

