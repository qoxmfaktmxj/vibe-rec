import Link from "next/link";

import { AdminLogoutButton } from "@/features/admin/auth/AdminLogoutButton";
import { JobPostingList } from "@/features/recruitment/job-postings/JobPostingList";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { getJobPostings } from "@/shared/api/recruitment";

export default async function JobPostingListPage() {
  const [jobPostings, session] = await Promise.all([
    getJobPostings().catch(() => []),
    getCurrentAdminSession().catch(() => null),
  ]);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="glass-nav sticky top-0 z-50 border-b border-outline-variant px-6 py-4 md:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link
            href="/"
            className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface"
          >
            Vibe Rec
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/job-postings"
              className="text-[13px] font-normal text-primary"
            >
              채용 공고
            </Link>
            <a
              href="https://www.minseok91.cloud"
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-normal text-on-surface transition-colors hover:text-primary"
            >
              문의
            </a>
            {session ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  대시보드
                </Link>
                <AdminLogoutButton redirectTo="/job-postings" />
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-16 md:px-16">
        {jobPostings.length === 0 ? (
          <div className="mb-8 rounded-sm border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
            Job postings could not be loaded from the API right now. The rest
            of the site is still available.
          </div>
        ) : null}
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-on-surface-variant">
              주요 공고
            </p>
            <h1 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
              전체 채용 공고
            </h1>
          </div>
        </div>
        <JobPostingList jobPostings={jobPostings} />
      </main>
    </div>
  );
}
