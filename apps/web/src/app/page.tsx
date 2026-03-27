import { JobPostingBrowser } from "@/features/recruitment/job-postings/JobPostingBrowser";
import { LegalLayerLinks } from "@/features/recruitment/legal/LegalLayerLinks";
import { PublicSiteHeader } from "@/features/recruitment/layout/PublicSiteHeader";
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
      <PublicSiteHeader activePath="/" />

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
              공고 등록, 지원서 관리, 면접 평가, 최종 결정까지 HireFlow에서 일관된 채용 프로세스를 운영할 수 있습니다.
            </p>
            <a
              href="#positions"
              className="mt-2 inline-flex items-center gap-2 rounded-sm border border-primary/30 px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              채용 공고 보기 ↓
            </a>
          </div>
        </section>

        <section id="positions" className="mx-auto max-w-7xl px-6 py-16 md:px-16">
          {fetchError ? (
            <div className="mb-8 rounded-sm border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
              채용 공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          ) : null}
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <h2 className="font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
                지원 가능한 채용 공고
              </h2>
            </div>
          </div>
          <JobPostingBrowser
            jobPostings={applicableJobPostings}
            emptyMessage="현재 모집 중인 포지션이 없습니다. 문의를 남겨보세요."
            pageSize={9}
          />
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-container-low px-6 py-8 md:px-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-[11px] text-on-surface-variant md:flex-row md:items-center md:justify-between">
          <p>© 2026 HireFlow. 모든 권리 보유.</p>
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
