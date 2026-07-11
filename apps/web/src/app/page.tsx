import { JobPostingBrowser } from "@/features/recruitment/job-postings/JobPostingBrowser";
import { PublicSiteFooter } from "@/features/recruitment/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/features/recruitment/layout/PublicSiteHeader";
import { RecruitmentStepper } from "@/features/shared/RecruitmentStepper";
import { ScrollReveal } from "@/features/recruitment/shared/ScrollReveal";
import { getJobPostings } from "@/shared/api/recruitment";
import {
  getApplicationStatusClassName,
  isJobPostingOpenForApplications,
} from "@/shared/lib/recruitment";

const heroProcessSteps = [
  { label: "서류", description: "지원서와 이력서를 검토합니다." },
  { label: "과제", description: "직무 관련 과제를 수행합니다." },
  { label: "면접", description: "실무진·임원 면접을 진행합니다." },
  { label: "최종", description: "처우 협의 후 합류를 확정합니다." },
];

const demoApplicationRows = [
  { name: "김지수", jobTitle: "백엔드 엔지니어", status: "SUBMITTED" as const },
  { name: "박서연", jobTitle: "프로덕트 디자이너", status: "DRAFT" as const },
  { name: "이도현", jobTitle: "데이터 분석가", status: "SUBMITTED" as const },
];

function getDemoStatusLabel(status: "SUBMITTED" | "DRAFT") {
  return status === "SUBMITTED" ? "제출 완료" : "임시 저장";
}

function ProductFragment() {
  return (
    <div
      aria-hidden="true"
      className="rounded-xl border border-outline-variant bg-card p-6 elevation-3"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
        지원 현황
      </p>

      <div className="mt-4 space-y-2">
        {demoApplicationRows.map((row) => (
          <div
            key={row.name}
            className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-on-surface">{row.name}</p>
              <p className="truncate text-xs text-on-surface-variant">{row.jobTitle}</p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getApplicationStatusClassName(row.status)}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {getDemoStatusLabel(row.status)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-outline-variant pt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
          전형 단계 · 김지수
        </p>
        <div className="mt-4">
          <RecruitmentStepper
            steps={[
              { label: "서류" },
              { label: "과제" },
              { label: "면접" },
              { label: "최종" },
            ]}
            currentIndex={2}
          />
        </div>
      </div>
    </div>
  );
}

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
        <section className="hero-gradient border-b border-outline-variant px-6 py-20 md:px-16 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 lg:items-center lg:gap-8">
            <div className="flex flex-col items-start gap-7 lg:col-span-7">
              <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-1.5 text-xs font-medium text-brand">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                현재 지원 가능한 공고 {applicableJobPostings.length}건
              </span>

              <h1 className="animate-fade-in-up-delay-1 font-headline text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.12] tracking-[-0.02em] text-on-surface">
                지금 어디까지 왔는지
                <br />
                보이는 채용
              </h1>

              <p className="animate-fade-in-up-delay-2 max-w-xl text-sm leading-7 text-on-surface-variant md:text-base md:leading-8">
                지원서를 내고 나면 상태는 늘 궁금하죠. HireFlow는 서류부터 최종 합류까지
                지금 어느 단계인지, 다음엔 무엇을 해야 하는지를 화면 하나로 보여줍니다.
              </p>

              <div className="animate-fade-in-up-delay-3 flex flex-wrap gap-3">
                <a
                  href="#positions"
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  채용 공고 보기
                </a>
                <a
                  href="#process"
                  className="rounded-lg border border-outline-variant bg-card px-6 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  채용 절차 알아보기
                </a>
              </div>
            </div>

            <div className="animate-fade-in-up-delay-2 lg:col-span-5">
              <ProductFragment />
            </div>
          </div>
        </section>

        <section id="process" className="border-b border-outline-variant px-6 py-20 md:px-16 md:py-24">
          <ScrollReveal>
            <div className="mx-auto max-w-7xl">
              <div className="max-w-2xl">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand">
                  채용 절차
                </p>
                <h2 className="mt-3 font-headline text-2xl font-semibold tracking-[-0.015em] text-on-surface md:text-3xl">
                  4단계로 진행되는 채용 프로세스
                </h2>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                  모든 공고는 아래 순서를 기본으로 진행되며, 공고별 세부 일정은 각 상세 페이지에서 확인할 수 있습니다.
                </p>
              </div>

              <div className="mt-12 rounded-xl border border-outline-variant bg-card p-8 elevation-1 md:p-10">
                <RecruitmentStepper steps={heroProcessSteps} />
              </div>
            </div>
          </ScrollReveal>
        </section>

        <section id="positions" className="mx-auto max-w-7xl px-6 py-16 md:px-16">
          {fetchError ? (
            <div className="mb-8 rounded-lg border border-destructive/20 bg-error-container px-5 py-4 text-sm text-destructive">
              채용 공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          ) : null}
          <ScrollReveal>
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <h2 className="font-headline text-3xl font-semibold tracking-[-0.02em] text-on-surface">
                  지원 가능한 채용 공고
                </h2>
              </div>
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
