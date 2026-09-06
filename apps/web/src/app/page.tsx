import Link from "next/link";

import { JobPostingBrowser } from "@/features/recruitment/job-postings/JobPostingBrowser";
import { CareerSignalMap } from "@/features/recruitment/landing/CareerSignalMap";
import { PublicSiteFooter } from "@/features/recruitment/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/features/recruitment/layout/PublicSiteHeader";
import { ScrollReveal } from "@/features/recruitment/shared/ScrollReveal";
import { getJobPostings } from "@/shared/api/recruitment";
import { isJobPostingOpenForApplications } from "@/shared/lib/recruitment";

export default async function Home() {
  const { jobPostings, fetchError } = await getJobPostings()
    .then((result) => ({
      jobPostings: result,
      fetchError: false,
    }))
    .catch(() => ({
      jobPostings: [],
      fetchError: true,
    }));
  const applicableJobPostings = jobPostings.filter(isJobPostingOpenForApplications);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicSiteHeader activePath="/" tone="signal" />

      <main>
        <section className="signal-hero px-6 pb-12 pt-12 md:px-16 md:pb-20 md:pt-40">
          <div className="mx-auto grid max-w-7xl gap-6 lg:min-h-[620px] lg:grid-cols-12 lg:items-center lg:gap-6">
            <div className="relative z-10 flex flex-col items-start lg:col-span-7">
              <h1 className="signal-hero-title animate-fade-in-up font-headline text-[clamp(3.25rem,7vw,6rem)] font-semibold leading-[0.98] tracking-[-0.02em]">
                지원의 모든 순간이,
                <br />
                한 흐름으로 보입니다
              </h1>

              <p className="animate-fade-in-up-delay-1 mt-8 max-w-xl text-base leading-8 text-signal-soft md:text-lg md:leading-9">
                열린 포지션을 발견하고 지원서를 제출한 뒤, 다음 전형까지 같은 화면 언어로 이어집니다.
              </p>

              <div className="animate-fade-in-up-delay-2 mt-10 flex flex-wrap items-center gap-5">
                <a
                  href="#positions"
                  className="signal-primary-action group inline-flex min-h-12 items-center gap-4 rounded-full px-6 py-3 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-signal-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-signal"
                >
                  열린 포지션 보기
                  <span aria-hidden="true" className="motion-arrow transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </a>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-signal-muted">
                  현재 {applicableJobPostings.length}개 포지션 모집 중
                </p>
              </div>
            </div>

            <div className="animate-fade-in-up-delay-2 lg:col-span-5">
              <CareerSignalMap
                jobPostings={applicableJobPostings.map(({ id, title, location }) => ({
                  id,
                  title,
                  location,
                }))}
              />
            </div>
          </div>
        </section>

        <section className="signal-journey border-b border-outline-variant">
          <div className="mx-auto grid max-w-7xl md:grid-cols-3">
            {[
              ["공고를 찾고", "직무와 근무 조건을 빠르게 비교합니다."],
              ["지원서를 제출하고", "작성한 내용과 제출 상태를 이어서 관리합니다."],
              ["다음 단계를 확인합니다", "현재 전형과 필요한 행동을 놓치지 않습니다."],
            ].map(([title, description], index) => (
              <div key={title} className="signal-journey-step">
                <span className="font-mono text-xs tabular-nums text-brand">0{index + 1}</span>
                <h2 className="mt-5 font-headline text-2xl font-semibold text-on-surface">
                  {title}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-7 text-on-surface-variant">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="positions" className="mx-auto max-w-7xl px-6 py-20 md:px-16 md:py-28">
          {fetchError ? (
            <div className="mb-8 rounded-lg border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
              채용 공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          ) : null}
          <ScrollReveal>
            <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="max-w-2xl font-headline text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.03] tracking-[-0.02em] text-on-surface">
                  지금 열려 있는 역할
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-on-surface-variant">
                  관심 있는 역할을 살펴보고, 전형 단계와 지원 기간을 한 번에 확인하세요.
                </p>
              </div>
              <Link
                href="/job-postings"
                className="group inline-flex min-h-11 items-center gap-3 self-start rounded-full border border-outline px-5 py-2.5 text-sm font-semibold text-on-surface outline-none transition-colors hover:border-brand hover:text-brand focus-visible:ring-2 focus-visible:ring-ring/40 md:self-auto"
              >
                전체 공고
                <span aria-hidden="true" className="motion-arrow transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
            <JobPostingBrowser
              jobPostings={applicableJobPostings}
              emptyMessage="현재 모집 중인 포지션이 없습니다. 문의를 남겨보세요."
              pageSize={9}
            />
          </ScrollReveal>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
