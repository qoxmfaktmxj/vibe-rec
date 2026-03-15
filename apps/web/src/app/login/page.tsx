import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/features/admin/auth/AdminLoginForm";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";

export default async function LoginPage() {
  const session = await getCurrentAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.2),_transparent_36%),linear-gradient(180deg,_#fcfbf7_0%,_#f3efe5_48%,_#ebe5d8_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-white"
          >
            Back to recruitment MVP
          </Link>
          <p className="text-sm text-stone-500">
            Phase 2 slice: session auth and protected admin shell
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2.25rem] border border-black/8 bg-white/82 p-8 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
            <div className="inline-flex rounded-full bg-teal-950 px-4 py-1.5 font-mono text-xs tracking-[0.24em] text-teal-50 uppercase">
              Admin Slice
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-stone-950 md:text-6xl">
              Recruiter shell sign-in
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700 md:text-lg">
              The admin flow now issues a persisted backend session and stores it
              as an HTTP-only cookie in Next.js. Unauthenticated access is
              redirected back to this screen.
            </p>
          </div>

          <AdminLoginForm />
        </section>
      </div>
    </main>
  );
}
