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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_36%),linear-gradient(180deg,_#fcfbf7_0%,_#f3efe5_48%,_#ebe5d8_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="grid gap-4 rounded-[2rem] border border-black/8 bg-white/86 p-6 shadow-[0_24px_80px_rgba(43,35,18,0.08)] lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
              Recruiter Shell
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
              Admin session is active
            </h1>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              This layout is protected by the persisted admin session stored in
              PostgreSQL and mirrored to a Next.js HTTP-only cookie.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-stone-950 px-5 py-5 text-sm text-stone-100">
            <p className="font-medium">{session.displayName}</p>
            <p className="mt-1 text-stone-300">
              {session.username} · {session.role}
            </p>
            <p className="mt-3 text-xs text-stone-400">
              Expires {formatDateTime(session.expiresAt)}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:opacity-90"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/applicants"
                className="inline-flex items-center justify-center rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-100 transition hover:border-stone-500 hover:text-white"
              >
                Applicants
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-100 transition hover:border-stone-500 hover:text-white"
              >
                Public MVP
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
