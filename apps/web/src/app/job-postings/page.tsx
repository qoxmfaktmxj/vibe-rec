import type { Metadata } from "next";

import { JobPostingBrowser } from "@/features/recruitment/job-postings/JobPostingBrowser";
import { PublicSiteFooter } from "@/features/recruitment/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/features/recruitment/layout/PublicSiteHeader";
import { RetryPageButton } from "@/features/recruitment/shared/RetryPageButton";
import { getJobPostings } from "@/shared/api/recruitment";
import { isJobPostingOpenForApplications } from "@/shared/lib/recruitment";

export const metadata: Metadata = {
  title: "채용 공고 | HireFlow",
  description: "지금 지원 가능한 HireFlow 채용 공고를 직무와 근무 조건별로 살펴보세요.",
};

export default async function JobPostingListPage() {
  const { jobPostings, fetchError } = await getJobPostings()
    .then((result) => ({
      jobPostings: result,
      fetchError: false,
    }))
    .catch(() => ({
      jobPostings: [],
      fetchError: true,
    }));
  const openJobPostingCount = jobPostings.filter(isJobPostingOpenForApplications).length;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicSiteHeader activePath="/job-postings" />

      <main id="main-content" tabIndex={-1}>
        <section className="job-browser-hero px-6 py-16 md:px-16 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)] lg:items-end">
            <div>
              <h1 className="max-w-4xl font-headline text-[clamp(3.25rem,7vw,6rem)] font-semibold leading-[0.98] tracking-[-0.02em] text-signal-foreground">
                다음 역할을 찾는 일이
                <br />
                더 선명해집니다
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-signal-soft md:text-lg">
                직무와 근무 조건, 전형 단계를 비교하고 지금 지원 가능한 포지션을 빠르게 찾으세요.
              </p>
            </div>
            <div className="job-browser-count">
              <strong className="font-headline text-7xl font-semibold tabular-nums text-signal-accent">
                {String(openJobPostingCount).padStart(2, "0")}
              </strong>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-signal-muted">
                모집 중인 포지션
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-16 md:py-24">
          {fetchError ? (
            <div className="mb-8 flex flex-col items-start justify-between gap-4 border-y border-destructive/25 bg-error-container px-5 py-5 text-sm text-destructive sm:flex-row sm:items-center" role="alert">
              <p>채용 공고를 불러오지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.</p>
              <RetryPageButton className="min-h-11 shrink-0 rounded-full border border-destructive/35 px-4 py-2 font-semibold outline-none hover:bg-destructive/5 focus-visible:ring-2 focus-visible:ring-destructive/40" />
            </div>
          ) : jobPostings.length === 0 ? (
            <div className="border-y border-outline-variant px-4 py-20 text-center">
              <p className="font-headline text-2xl font-semibold tracking-[-0.015em] text-on-surface">
                현재 모집 중인 포지션이 없습니다
              </p>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-on-surface-variant">
                새로운 채용 공고가 열리면 이 페이지에서 확인할 수 있습니다.
              </p>
            </div>
          ) : (
            <JobPostingBrowser
              jobPostings={jobPostings}
              searchable
              showAvailabilityFilter
              defaultAvailabilityFilter="OPEN"
              searchPlaceholder="직무명, 소개, 근무지, 고용 형태로 검색"
              emptyMessage="검색 조건에 맞는 공고가 없습니다."
              pageSize={9}
            />
          )}

          <section aria-labelledby="application-help-title" className="mt-24 border-t-2 border-on-surface pt-8">
            <div className="grid gap-8 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
              <div>
                <h2 id="application-help-title" className="font-headline text-3xl font-semibold tracking-[-0.02em] text-on-surface">
                  지원 전에 궁금한 점
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-7 text-on-surface-variant">
                  공고를 고른 뒤 지원서를 작성하고 진행 상태를 확인하는 방법입니다.
                </p>
              </div>
              <div className="border-y border-outline-variant">
                <details className="group border-b border-outline-variant py-5 last:border-b-0">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md text-base font-semibold text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                    작성 중인 지원서를 나중에 이어서 쓸 수 있나요?
                    <span aria-hidden="true" className="motion-arrow text-xl font-normal transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pb-2 pt-3 text-sm leading-7 text-on-surface-variant">
                    로그인한 지원자는 지원서를 임시 저장하고 같은 공고에서 다시 이어서 작성할 수 있습니다.
                  </p>
                </details>
                <details className="group border-b border-outline-variant py-5 last:border-b-0">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md text-base font-semibold text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                    제출한 뒤 진행 상태는 어디에서 확인하나요?
                    <span aria-hidden="true" className="motion-arrow text-xl font-normal transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pb-2 pt-3 text-sm leading-7 text-on-surface-variant">
                    로그인 후 내 지원 현황에서 제출 여부, 현재 전형 단계, 다음 안내를 확인할 수 있습니다.
                  </p>
                </details>
                <details className="group py-5">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md text-base font-semibold text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                    공고 내용에 대해 문의하려면 어떻게 하나요?
                    <span aria-hidden="true" className="motion-arrow text-xl font-normal transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pb-2 pt-3 text-sm leading-7 text-on-surface-variant">
                    상단의 문의 링크를 이용하면 운영 문의 페이지를 새 창에서 열 수 있습니다.
                  </p>
                </details>
              </div>
            </div>
          </section>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
