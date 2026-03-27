import Link from "next/link";

import type { JobPostingSummary } from "@/entities/recruitment/model";
import {
  getEmploymentTypeLabel,
  formatRecruitmentPeriod,
  getRecruitmentCategoryLabel,
  getRecruitmentModeLabel,
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
      <section className="rounded-sm border border-outline-variant bg-card px-8 py-14 text-center text-sm text-on-surface-variant">
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
            className="flex h-full flex-col rounded-sm border border-outline-variant bg-card p-6"
          >
            <div className="flex flex-wrap gap-2">
              <span className="rounded-sm bg-surface-container-low px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-on-surface">
                {getRecruitmentCategoryLabel(jobPosting.recruitmentCategory)}
              </span>

              {!hideRecruitmentModeBadge ? (
                <span
                  className={`rounded-sm px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] ${
                    isRolling
                      ? "bg-primary/10 text-primary"
                      : "bg-stone-100 text-stone-700"
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
              <p>총 {jobPosting.stepCount}단계</p>
            </div>

            <Link
              href={`/job-postings/${jobPosting.id}`}
              className="mt-auto inline-flex w-fit self-start pt-6 text-[11px] font-semibold tracking-[0.04em] text-primary transition-colors hover:text-primary-foreground"
            >
              {isRolling ? "상세 보기" : "공고 보기"}
            </Link>
          </article>
        );
      })}
    </div>
  );
}
