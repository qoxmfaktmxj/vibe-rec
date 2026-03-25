import Link from "next/link";
import { redirect } from "next/navigation";

import { CandidateLogoutButton } from "@/features/recruitment/application/CandidateLogoutButton";
import { getCurrentCandidateSession } from "@/shared/api/candidate-auth";

export default async function MyPage() {
  const session = await getCurrentCandidateSession();

  if (!session) {
    redirect("/auth/login?next=/me");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-on-surface md:px-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              Candidate Workspace
            </p>
            <h1 className="mt-3 font-headline text-4xl font-medium tracking-[-0.05em]">
              {session.name}
            </h1>
          </div>
          <CandidateLogoutButton redirectTo="/" />
        </div>

        <section className="rounded-sm border border-outline-variant bg-card p-6">
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-on-surface-variant">Email</dt>
              <dd className="mt-1 font-medium">{session.email}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Phone</dt>
              <dd className="mt-1 font-medium">{session.phone}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Authenticated</dt>
              <dd className="mt-1 font-medium">
                {new Date(session.authenticatedAt).toLocaleString("ko-KR")}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Expires</dt>
              <dd className="mt-1 font-medium">
                {new Date(session.expiresAt).toLocaleString("ko-KR")}
              </dd>
            </div>
          </dl>
        </section>

        <div className="flex gap-3">
          <Link
            href="/job-postings"
            className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
          >
            View jobs
          </Link>
          <Link
            href="/"
            className="rounded-sm border border-outline-variant px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-on-surface"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
