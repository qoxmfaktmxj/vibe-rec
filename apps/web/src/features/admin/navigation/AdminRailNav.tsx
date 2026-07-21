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
          <div key={item.href} className="group relative flex items-center">
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                isActive
                  ? "border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
                  : "border-transparent text-sidebar-foreground/80 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              {isActive ? (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-5 w-[2px] -translate-x-[calc(100%+8px)] -translate-y-1/2 rounded-full bg-sidebar-primary"
                />
              ) : null}
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

            <span
              role="tooltip"
              className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-surface-dark px-2.5 py-1.5 font-mono text-xs text-on-dark opacity-0 elevation-2 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-within:opacity-100"
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

