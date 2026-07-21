import Link from "next/link";

import type { JobPostingSummary } from "@/entities/recruitment/model";
import {
  formatRecruitmentPeriod,
  getEmploymentTypeLabel,
  getJobPostingDdayInfo,
  getRecruitmentCategoryLabel,
  getRecruitmentModeLabel,
  getStepTypeLabel,
} from "@/shared/lib/recruitment";

interface JobPostingListProps {
  jobPostings: JobPostingSummary[];
  emptyMessage?: string;
  hideRecruitmentModeBadge?: boolean;
}

function JobPostingDdayMeta({
  jobPosting,
}: {
  jobPosting: JobPostingSummary;
}) {
  const ddayInfo = getJobPostingDdayInfo(jobPosting);

  if (ddayInfo.kind === "rolling") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brand">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
        상시 채용
      </span>
    );
  }

  if (ddayInfo.kind === "closed") {
    return (
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
        모집 마감
      </span>
    );
  }

  return (
    <span
      className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
        ddayInfo.urgent ? "font-semibold text-destructive" : "text-on-surface-variant"
      }`}
    >
      {ddayInfo.label}
    </span>
  );
}

function StepPreview({ jobPosting }: { jobPosting: JobPostingSummary }) {
  const steps = jobPosting.steps ?? [];

  if (steps.length === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`전형 단계: ${steps.map((step) => getStepTypeLabel(step.stepType)).join(", ")}`}
    >
      {steps.map((step, index) => (
        <span key={step.id ?? index} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden="true" className="h-px w-3 bg-outline-variant" />
          ) : null}
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-outline-variant"
          />
        </span>
      ))}
      <span className="ml-1 font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant">
        {steps.length}단계 전형
      </span>
    </div>
  );
}

export function JobPostingList({
  jobPostings,
  emptyMessage = "현재 표시할 채용 공고가 없습니다.",
  hideRecruitmentModeBadge = false,
}: JobPostingListProps) {
  if (jobPostings.length === 0) {
    return (
      <section className="rounded-xl border border-outline-variant bg-card px-8 py-14 text-center">
        <p className="font-headline text-lg font-semibold tracking-[-0.01em] text-on-surface">
          {emptyMessage}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">
          조건을 넓히거나 전체 공고 목록에서 다른 포지션을 찾아볼 수 있습니다.
        </p>
        <Link
          href="/job-postings"
          className="group/link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
        >
          전체 공고 보기
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-150 group-hover/link:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {jobPostings.map((jobPosting) => {
        const isRolling = jobPosting.recruitmentMode === "ROLLING";

        return (
          <article
            key={jobPosting.id}
            className="card-interactive flex h-full flex-col rounded-xl border border-outline-variant bg-card p-6 elevation-1"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-brand/8 px-2.5 py-1 text-xs font-medium text-brand">
                  {getRecruitmentCategoryLabel(jobPosting.recruitmentCategory)}
                </span>

                {!hideRecruitmentModeBadge ? (
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      isRolling
                        ? "bg-success/10 text-success"
                        : "bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    {getRecruitmentModeLabel(jobPosting.recruitmentMode)}
                  </span>
                ) : null}
              </div>

              <JobPostingDdayMeta jobPosting={jobPosting} />
            </div>

            <div className="mt-4 space-y-3">
              <h3 className="font-headline text-lg font-semibold tracking-[-0.02em] text-on-surface">
                {jobPosting.title}
              </h3>
              <p className="text-sm leading-6 text-on-surface-variant">
                {jobPosting.headline}
              </p>
            </div>

            <div className="mt-6 space-y-2 text-sm text-on-surface-variant">
              <p>{getEmploymentTypeLabel(jobPosting.employmentType)}</p>
              <p>{jobPosting.location}</p>
              <p className="tabular-nums">{formatRecruitmentPeriod(jobPosting)}</p>
              <div className="pt-1">
                <StepPreview jobPosting={jobPosting} />
              </div>
            </div>

            <Link
              href={`/job-postings/${jobPosting.id}`}
              className="group/link mt-auto inline-flex w-fit items-center gap-1 self-start pt-6 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
            >
              {isRolling ? "상세 보기" : "공고 보기"}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-150 group-hover/link:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
