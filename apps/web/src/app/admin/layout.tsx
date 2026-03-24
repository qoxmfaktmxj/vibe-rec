import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/features/admin/auth/AdminLogoutButton";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 4.5h6.75v6.75H3.75V4.5zm9.75 0h6.75v6.75H13.5V4.5zM3.75 14.25h6.75V21H3.75v-6.75zm9.75 3h6.75V21H13.5v-3.75z"
      />
    ),
  },
  {
    href: "/admin/applicants",
    label: "Applicants",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0"
      />
    ),
  },
  {
    href: "/",
    label: "Public",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12h16.5M12 3.75c3.519 0 6.692 1.43 8.99 3.744M12 20.25c-3.519 0-6.692-1.43-8.99-3.744"
      />
    ),
  },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentAdminSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-on-surface md:grid md:grid-cols-[64px_minmax(0,1fr)]">
      <aside className="hidden bg-sidebar text-sidebar-foreground md:flex md:min-h-screen md:flex-col md:items-center md:justify-between md:py-6">
        <div className="space-y-8">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-sidebar-border bg-sidebar-accent"
          >
            <span className="font-headline text-lg font-medium">V</span>
          </Link>
          <nav className="flex flex-col items-center gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-10 w-10 items-center justify-center rounded-sm border border-transparent transition-colors hover:border-sidebar-border hover:bg-sidebar-accent"
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
            ))}
          </nav>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent text-xs font-medium uppercase">
          {session.displayName?.charAt(0) ?? "A"}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-outline-variant bg-surface px-6 py-5 md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                Recruiting Workspace
              </p>
              <h1 className="mt-2 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
                {session.displayName}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden text-right md:block">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                  {session.role}
                </p>
                <p className="text-sm text-on-surface-variant">
                  Admin session active
                </p>
              </div>
              <AdminLogoutButton />
            </div>
          </div>
        </header>
        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
