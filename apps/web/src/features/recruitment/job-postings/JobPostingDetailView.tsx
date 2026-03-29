import type { ReactNode } from "react";

import type { JobPostingDetail } from "@/entities/recruitment/model";
import {
  formatDateRange,
  formatRecruitmentPeriod,
  getEmploymentTypeLabel,
  getRecruitmentCategoryLabel,
  getRecruitmentModeLabel,
  getStepTypeLabel,
} from "@/shared/lib/recruitment";

interface JobPostingDetailViewProps {
  jobPosting: JobPostingDetail;
  applicationSlot: ReactNode;
}

export function JobPostingDetailView({
  jobPosting,
  applicationSlot,
}: JobPostingDetailViewProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_420px]">
      <div className="space-y-8">
        <section className="rounded-sm border border-outline-variant bg-card p-8">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-outline-variant pb-5">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                {jobPosting.publicKey}
              </p>
              <h1 className="mt-3 font-headline text-4xl font-medium tracking-[-0.05em] text-on-surface">
                {jobPosting.title}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-sm bg-surface-container-low px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-on-surface">
                  {getRecruitmentCategoryLabel(jobPosting.recruitmentCategory)}
                </span>
                <span
                  className={`rounded-sm px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] ${
                    jobPosting.recruitmentMode === "ROLLING"
                      ? "bg-primary/10 text-primary"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {getRecruitmentModeLabel(jobPosting.recruitmentMode)}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-right font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              <p>{getEmploymentTypeLabel(jobPosting.employmentType)}</p>
              <p>{jobPosting.location}</p>
              <p>{formatRecruitmentPeriod(jobPosting)}</p>
            </div>
          </div>

          <p className="mt-6 text-base leading-8 text-on-surface-variant">
            {jobPosting.headline}
          </p>
          <p className="mt-6 whitespace-pre-line text-sm leading-8 text-on-surface-variant">
            {jobPosting.description}
          </p>
        </section>

        <section className="rounded-sm border border-outline-variant bg-card p-8">
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant pb-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                전형
              </p>
              <h2 className="mt-3 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
                채용 단계
              </h2>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              총 {jobPosting.steps.length}단계
            </span>
          </div>

          <ol className="mt-6 space-y-4">
            {jobPosting.steps.map((step) => (
              <li
                key={`${jobPosting.id}-${step.stepOrder}`}
                className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">
                      {step.stepOrder}단계 · {getStepTypeLabel(step.stepType)}
                    </p>
                    <h3 className="font-headline text-lg font-medium tracking-[-0.03em] text-on-surface">
                      {step.title}
                    </h3>
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                    {formatDateRange(step.startsAt, step.endsAt)}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">{applicationSlot}</aside>
    </div>
  );
}
