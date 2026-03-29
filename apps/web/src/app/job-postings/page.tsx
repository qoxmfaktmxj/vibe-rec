import { JobPostingBrowser } from "@/features/recruitment/job-postings/JobPostingBrowser";
import { PublicSiteHeader } from "@/features/recruitment/layout/PublicSiteHeader";
import { getJobPostings } from "@/shared/api/recruitment";

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

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicSiteHeader activePath="/job-postings" />

      <main className="mx-auto max-w-7xl px-6 py-16 md:px-16">
        {fetchError ? (
          <div className="mb-8 rounded-sm border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
            채용 공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        ) : null}

        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-on-surface-variant">
              채용 공고
            </p>
            <h1 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
              지원 가능한 채용 공고
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
              기본값은 지금 바로 지원 가능한 공고만 보여주고, 필요할 때 전체 공고로 확장해 볼 수 있습니다.
            </p>
          </div>
        </div>

        {!fetchError && jobPostings.length === 0 ? (
          <div className="rounded-sm border border-outline-variant bg-card px-8 py-16 text-center">
            <p className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
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
      </main>
    </div>
  );
}
