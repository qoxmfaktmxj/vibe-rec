import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/features/admin/auth/AdminLogoutButton";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { formatDateTime } from "@/shared/lib/recruitment";

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
    <div className="min-h-screen bg-background text-on-surface">
      {/* Glass Navigation */}
      <nav className="glass-nav sticky top-0 z-50 border-b border-outline-variant/15 px-8 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-12">
            <Link
              href="/admin"
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="font-headline text-xl font-extrabold tracking-tight text-primary">
                Vibe Rec
              </span>
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin"
                className="font-medium text-on-surface-variant transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/applicants"
                className="font-medium text-on-surface-variant transition-colors hover:text-primary"
              >
                Applicants
              </Link>
              <Link
                href="/"
                className="font-medium text-on-surface-variant transition-colors hover:text-primary"
              >
                Public Site
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right text-sm md:block">
              <p className="font-semibold text-on-surface">
                {session.displayName}
              </p>
              <p className="text-xs text-on-surface-variant">
                {session.role} &bull; expires{" "}
                {formatDateTime(session.expiresAt)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed font-headline text-sm font-bold text-primary">
              {session.displayName?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <AdminLogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-8 py-10">{children}</main>
    </div>
  );
}
