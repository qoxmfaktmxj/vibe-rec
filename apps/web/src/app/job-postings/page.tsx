import { JobPostingBrowser } from "@/features/recruitment/job-postings/JobPostingBrowser";
import { PublicSiteFooter } from "@/features/recruitment/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/features/recruitment/layout/PublicSiteHeader";
import { getJobPostings } from "@/shared/api/recruitment";
import { isJobPostingOpenForApplications } from "@/shared/lib/recruitment";

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

      <main>
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
                OPEN POSITIONS
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-16 md:py-24">
          {fetchError ? (
            <div className="mb-8 rounded-lg border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
              채용 공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          ) : null}

          {!fetchError && jobPostings.length === 0 ? (
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
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
