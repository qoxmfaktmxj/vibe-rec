import { JobPostingBrowser } from "@/features/recruitment/job-postings/JobPostingBrowser";
import { PublicSiteHeader } from "@/features/recruitment/layout/PublicSiteHeader";
import { getJobPostings } from "@/shared/api/recruitment";

export default async function JobPostingListPage() {
  const jobPostings = await getJobPostings().catch(() => []);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicSiteHeader activePath="/job-postings" />

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
          searchPlaceholder="직무명, 소개, 근무지, 고용 형태로 검색"
          emptyMessage="현재 등록된 채용 공고가 없습니다."
          pageSize={9}
        />
      </main>
    </div>
  );
}
