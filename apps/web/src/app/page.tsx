import Link from "next/link";

import { JobPostingList } from "@/features/recruitment/job-postings/JobPostingList";
import { getJobPostings } from "@/shared/api/recruitment";

export default async function Home() {
  const jobPostings = await getJobPostings();
  const openJobPostingCount = jobPostings.filter(
    (jobPosting) => jobPosting.status === "OPEN",
  ).length;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Nav */}
      <nav className="glass-nav sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/15 px-8 py-4">
        <div className="flex items-center gap-12">
          <span className="font-headline text-2xl font-extrabold tracking-tight text-primary">
            Vibe Rec
          </span>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="font-medium text-on-surface transition-colors hover:text-primary"
            >
              공고
            </Link>
          </div>
        </div>
        <Link
          href="/login"
          className="rounded-lg bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
        >
          로그인
        </Link>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden px-8 pb-32 pt-20">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
            <div className="z-10">
              <span className="mb-6 inline-block rounded-full bg-secondary-fixed px-4 py-1 text-sm font-bold text-[#005313]">
                {openJobPostingCount}개 모집 중
              </span>
              <h1 className="mb-8 font-headline text-5xl font-extrabold leading-[1.1] tracking-tight text-on-surface lg:text-6xl">
                다음 커리어를{" "}
                <span className="text-primary">여기서 시작하세요.</span>
              </h1>
              <p className="mb-12 max-w-lg text-xl leading-relaxed text-on-surface-variant">
                검증된 채용 공고를 탐색하고 간편하게 지원하세요.
              </p>
            </div>

            {/* Stats card */}
            <div className="relative hidden lg:block">
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary-fixed opacity-30 blur-3xl" />
              <div className="ambient-shadow relative z-10 rounded-2xl bg-surface-container-lowest p-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="font-headline text-4xl font-bold text-primary">
                      {jobPostings.length}
                    </p>
                    <p className="mt-1 text-sm font-medium text-on-surface-variant">
                      전체 공고
                    </p>
                  </div>
                  <div>
                    <p className="font-headline text-4xl font-bold text-secondary">
                      {openJobPostingCount}
                    </p>
                    <p className="mt-1 text-sm font-medium text-on-surface-variant">
                      모집 중
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section className="bg-surface-container-low px-8 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 flex items-end justify-between">
              <div>
                <h2 className="mb-4 font-headline text-4xl font-bold">
                  현재 채용 공고
                </h2>
                <p className="text-on-surface-variant">
                  지금 지원 가능한 포지션을 확인하세요.
                </p>
              </div>
            </div>

            <JobPostingList jobPostings={jobPostings} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-8 py-24">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-12 text-white md:col-span-2">
              <div className="relative z-10">
                <h2 className="mb-6 font-headline text-4xl font-bold">
                  채용을 시작할
                  <br />
                  준비가 됐나요?
                </h2>
                <p className="mb-8 max-w-md text-lg text-primary-fixed">
                  운영자 대시보드에서 지원자를 관리하고 제출 현황을 검토하세요.
                </p>
                <Link
                  href="/login"
                  className="inline-flex rounded-lg bg-surface-container-lowest px-8 py-4 font-bold text-primary transition-transform hover:scale-105"
                >
                  대시보드 열기
                </Link>
              </div>
            </div>
            <div className="rounded-2xl bg-secondary-container p-12 text-[#00731e]">
              <svg
                className="mb-6 h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mb-4 font-headline text-2xl font-bold">
                모던 &amp; 안정적
              </h3>
              <p className="text-sm leading-relaxed">
                PostgreSQL, Spring Boot, Next.js 기반의 안정적이고 확장 가능한
                채용 플랫폼.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/15 bg-surface-container-low px-8 pb-10 pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 border-t border-outline-variant/15 pt-10 md:flex-row">
            <p className="text-xs text-on-surface-variant">
              &copy; 2024 Vibe Rec. All rights reserved.
            </p>
            <span className="font-headline text-lg font-extrabold tracking-tight text-primary">
              Vibe Rec
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
