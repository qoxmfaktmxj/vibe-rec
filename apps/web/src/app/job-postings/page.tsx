import { JobPostingBrowser } from "@/features/recruitment/job-postings/JobPostingBrowser";
import { PublicSiteHeader } from "@/features/recruitment/layout/PublicSiteHeader";
import { getJobPostings } from "@/shared/api/recruitment";

export default async function JobPostingListPage() {
  let fetchError = false;
  const jobPostings = await getJobPostings().catch(() => {
    fetchError = true;
    return [];
  });

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicSiteHeader activePath="/job-postings" />

      <main className="mx-auto max-w-7xl px-6 py-16 md:px-16">
        {fetchError && (
          <div className="mb-8 rounded-sm border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
            채용 공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        )}

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

        {!fetchError && jobPostings.length === 0 ? (
          <div className="rounded-sm border border-outline-variant bg-card px-8 py-16 text-center">
            <p className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
              현재 모집 중인 포지션이 없습니다
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-on-surface-variant">
              새로운 채용 공고가 열리면 이 페이지에서 확인할 수 있습니다. 관심 포지션이 있으시면 문의를 남겨주세요.
            </p>
            <a
              href="https://www.minseok91.cloud"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center rounded-sm border border-outline-variant px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface transition-colors hover:border-primary hover:text-primary"
            >
              문의하기 →
            </a>
          </div>
        ) : (
          <JobPostingBrowser
            jobPostings={jobPostings}
            searchable
            searchPlaceholder="직무명, 소개, 근무지, 고용 형태로 검색"
            emptyMessage="검색 조건에 맞는 공고가 없습니다."
            pageSize={9}
          />
        )}
      </main>
    </div>
  );
}
