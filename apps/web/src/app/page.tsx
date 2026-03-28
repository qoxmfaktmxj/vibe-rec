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
        <section className="hero-gradient border-b border-outline-variant px-6 py-28 md:px-16 md:py-36">
          <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-7 text-center">
            <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success"></span>
              현재 지원 가능한 공고 {applicableJobPostings.length}건
            </span>
            <h1 className="animate-fade-in-up-delay-1 max-w-4xl font-headline text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-on-surface md:text-7xl">
              채용 운영의 모든 흐름을
              <br />
              한 곳에서 관리하세요
            </h1>
            <p className="animate-fade-in-up-delay-2 max-w-2xl text-sm leading-7 text-on-surface-variant md:text-base md:leading-8">
              공고 등록, 지원서 관리, 면접 평가, 최종 결정까지
              <br className="hidden md:block" />
              HireFlow에서 일관된 채용 프로세스를 운영할 수 있습니다.
            </p>
            <div className="animate-fade-in-up-delay-3 mt-2 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#positions"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
              >
                채용 공고 보기
              </a>
              <a
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-card px-7 py-3.5 text-sm font-semibold text-primary transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                지원자 로그인
              </a>
            </div>
          </div>
        </section>

        <section id="positions" className="mx-auto max-w-7xl px-6 py-16 md:px-16">
          {fetchError ? (
            <div className="mb-8 rounded-lg border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
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
