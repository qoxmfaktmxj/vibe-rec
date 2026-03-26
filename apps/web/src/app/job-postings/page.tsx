import Link from "next/link";

import { AdminLogoutButton } from "@/features/admin/auth/AdminLogoutButton";
import { CandidateLogoutButton } from "@/features/recruitment/application/CandidateLogoutButton";
import { JobPostingBrowser } from "@/features/recruitment/job-postings/JobPostingBrowser";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { getCurrentCandidateSession } from "@/shared/api/candidate-auth";
import { getJobPostings } from "@/shared/api/recruitment";

export default async function JobPostingListPage() {
  const [jobPostings, adminSession, candidateSession] = await Promise.all([
    getJobPostings().catch(() => []),
    getCurrentAdminSession().catch(() => null),
    getCurrentCandidateSession().catch(() => null),
  ]);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="glass-nav sticky top-0 z-50 border-b border-outline-variant px-6 py-4 md:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link
            href="/"
            className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface"
          >
            HireFlow
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/job-postings" className="text-[13px] font-normal text-primary">
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
            {adminSession ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  관리자 대시보드
                </Link>
                <AdminLogoutButton redirectTo="/job-postings" />
              </div>
            ) : candidateSession ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                    지원자
                  </p>
                  <p className="text-sm text-on-surface">{candidateSession.name}</p>
                </div>
                <CandidateLogoutButton redirectTo="/job-postings" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/login?mode=signup"
                  className="rounded-sm border border-outline-variant px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-on-surface transition-colors hover:border-primary hover:text-primary"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-16 md:px-16">
        {jobPostings.length === 0 ? (
          <div className="mb-8 rounded-sm border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
            현재 채용 공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        ) : null}
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-on-surface-variant">
              채용 공고
            </p>
            <h1 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
              전체 채용 공고
            </h1>
          </div>
        </div>
        <JobPostingBrowser
          jobPostings={jobPostings}
          searchable
          searchPlaceholder="직무명, 한 줄 소개, 근무지, 고용형태로 검색"
          emptyMessage="현재 등록된 채용 공고가 없습니다."
        />
      </main>
    </div>
  );
}
