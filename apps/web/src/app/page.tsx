import Link from "next/link";

import { CandidateLogoutButton } from "@/features/recruitment/application/CandidateLogoutButton";
import { JobPostingBrowser } from "@/features/recruitment/job-postings/JobPostingBrowser";
import { LegalLayerLinks } from "@/features/recruitment/legal/LegalLayerLinks";
import { getCurrentCandidateSession } from "@/shared/api/candidate-auth";
import { getJobPostings } from "@/shared/api/recruitment";
import { isJobPostingOpenForApplications } from "@/shared/lib/recruitment";

const navLinks = [
  { href: "/job-postings", label: "채용 공고" },
  { href: "https://www.minseok91.cloud", label: "문의", external: true },
] as const;

export default async function Home() {
  const [jobPostings, candidateSession] = await Promise.all([
    getJobPostings().catch(() => []),
    getCurrentCandidateSession().catch(() => null),
  ]);

  const applicableJobPostings = jobPostings.filter(isJobPostingOpenForApplications);

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
            {navLinks.map((item) =>
              "external" in item ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-normal text-on-surface transition-colors hover:text-primary"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[13px] font-normal text-on-surface transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ),
            )}
            {candidateSession ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                    지원자
                  </p>
                  <p className="text-sm text-on-surface">{candidateSession.name}</p>
                </div>
                <CandidateLogoutButton redirectTo="/" />
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

      <main>
        <section className="border-b border-outline-variant bg-[#fdf2f8] px-6 py-24 md:px-16">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-on-surface-variant">
              현재 지원 가능한 공고 {applicableJobPostings.length}건
            </span>
            <h1 className="max-w-4xl font-headline text-5xl font-light leading-[1.08] tracking-[-0.06em] text-primary md:text-7xl">
              채용 운영의 모든 흐름을
              <br />
              한 곳에서 관리하세요
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant md:text-base">
              공고 등록, 지원서 관리, 면접 평가, 최종 결정까지 HireFlow에서
              표준화된 채용 프로세스를 운영할 수 있습니다.
            </p>
            <Link
              href="/job-postings"
              className="rounded-sm bg-primary px-8 py-3 text-xs font-medium uppercase tracking-[0.24em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              공고 보기
            </Link>
          </div>
        </section>

        <section id="positions" className="mx-auto max-w-7xl px-6 py-16 md:px-16">
          {jobPostings.length === 0 ? (
            <div className="mb-8 rounded-sm border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
              현재 채용 공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          ) : null}
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-on-surface-variant">
                주요 공고
              </p>
              <h2 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
                지원 가능한 채용 포지션
              </h2>
            </div>
          </div>
          <JobPostingBrowser
            jobPostings={applicableJobPostings}
            emptyMessage="현재 바로 지원 가능한 채용 공고가 없습니다."
          />
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-container-low px-6 py-8 md:px-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-[11px] text-on-surface-variant md:flex-row md:items-center md:justify-between">
          <p>© 2026 HireFlow. All rights reserved.</p>
          <div className="flex gap-6">
            <LegalLayerLinks />
            <a
              href="https://www.minseok91.cloud"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-primary"
            >
              문의
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
