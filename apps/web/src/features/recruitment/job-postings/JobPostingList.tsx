import Link from "next/link";

import type { JobPostingSummary } from "@/entities/recruitment/model";
import {
  formatRecruitmentPeriod,
  getEmploymentTypeLabel,
  getRecruitmentCategoryLabel,
  getRecruitmentModeLabel,
  getStepTypeLabel,
} from "@/shared/lib/recruitment";

interface JobPostingListProps {
  jobPostings: JobPostingSummary[];
  emptyMessage?: string;
  hideRecruitmentModeBadge?: boolean;
}

export function JobPostingList({
  jobPostings,
  emptyMessage = "현재 표시할 채용 공고가 없습니다.",
  hideRecruitmentModeBadge = false,
}: JobPostingListProps) {
  if (jobPostings.length === 0) {
    return (
      <section className="rounded-xl border border-outline-variant bg-card px-8 py-14 text-center text-sm text-on-surface-variant">
        {emptyMessage}
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
            className="card-interactive card-shadow flex h-full flex-col rounded-xl border border-outline-variant bg-card p-6"
          >
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
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

            <div className="mt-4 space-y-3">
              <h3 className="font-headline text-lg font-medium tracking-[-0.03em] text-on-surface">
                {jobPosting.title}
              </h3>
              <p className="text-sm leading-6 text-on-surface-variant">
                {jobPosting.headline}
              </p>
            </div>

            <div className="mt-6 space-y-2 text-sm text-on-surface-variant">
              <p>{getEmploymentTypeLabel(jobPosting.employmentType)}</p>
              <p>{jobPosting.location}</p>
              <p>{formatRecruitmentPeriod(jobPosting)}</p>
              {(jobPosting.steps?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap items-center gap-1 font-mono text-xs text-on-surface-variant">
                  {(jobPosting.steps ?? []).slice(0, 3).map((step, index) => (
                    <span key={step.id ?? index} className="flex items-center gap-1">
                      {index > 0 ? <span aria-hidden="true">·</span> : null}
                      {getStepTypeLabel(step.stepType)}
                    </span>
                  ))}
                  {(jobPosting.steps?.length ?? 0) > 3 ? <span>외 더 있음</span> : null}
                </div>
              ) : null}
            </div>

            <Link
              href={`/job-postings/${jobPosting.id}`}
              className="mt-auto inline-flex w-fit self-start pt-6 text-sm font-semibold text-primary transition-colors hover:text-primary/70"
            >
              {isRolling ? "상세 보기" : "공고 보기"}
            </Link>
          </article>
        );
      })}
    </div>
  );
}
