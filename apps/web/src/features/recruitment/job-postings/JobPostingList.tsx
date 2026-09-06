"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

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
  const reduceMotion = useReducedMotion();

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
            className="motion-arrow inline-block transition-transform duration-150 group-hover/link:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </section>
    );
  }

  return (
    <m.div layout className="border-y border-outline-variant">
      {jobPostings.map((jobPosting, index) => {
        const isRolling = jobPosting.recruitmentMode === "ROLLING";

        return (
          <m.article
            layout="position"
            key={jobPosting.id}
            className="job-index-row border-b border-outline-variant last:border-b-0"
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
            }
          >
            <Link
              href={`/job-postings/${jobPosting.id}`}
              className="group grid min-h-44 gap-6 px-1 py-7 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 md:grid-cols-[3rem_minmax(0,1.35fr)_minmax(15rem,0.75fr)_3rem] md:items-center md:px-5"
              aria-label={`${jobPosting.title} 공고 보기`}
            >
              <span className="font-mono text-xs tabular-nums text-on-surface-variant">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand">
                    {getRecruitmentCategoryLabel(jobPosting.recruitmentCategory)}
                  </span>
                  {!hideRecruitmentModeBadge ? (
                    <span
                      className={`font-mono text-[11px] uppercase tracking-[0.12em] ${
                        isRolling ? "text-success" : "text-on-surface-variant"
                      }`}
                    >
                      {getRecruitmentModeLabel(jobPosting.recruitmentMode)}
                    </span>
                  ) : null}
                  <JobPostingDdayMeta jobPosting={jobPosting} />
                </div>
                <h3 className="max-w-3xl font-headline text-[clamp(1.45rem,2.3vw,2.25rem)] font-semibold leading-tight tracking-[-0.025em] text-on-surface transition-transform duration-300 ease-out group-hover:translate-x-2 group-focus-visible:translate-x-2">
                  {jobPosting.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                  {jobPosting.headline}
                </p>
              </div>

              <div className="space-y-3 text-sm text-on-surface-variant">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <span>{getEmploymentTypeLabel(jobPosting.employmentType)}</span>
                  <span>{jobPosting.location}</span>
                </div>
                <p className="font-mono text-xs tabular-nums">
                  {formatRecruitmentPeriod(jobPosting)}
                </p>
                <StepPreview jobPosting={jobPosting} />
              </div>

              <span className="job-index-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </m.article>
        );
      })}
    </m.div>
  );
}
