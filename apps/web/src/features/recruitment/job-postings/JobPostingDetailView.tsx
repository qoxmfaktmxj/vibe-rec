import type { ReactNode } from "react";

import type { JobPostingDetail } from "@/entities/recruitment/model";
import { RecruitmentStepper } from "@/features/recruitment/shared/RecruitmentStepper";
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
  const stepperSteps = jobPosting.steps.map((step) => ({
    label: step.title,
    description: step.description || getStepTypeLabel(step.stepType),
    meta: formatDateRange(step.startsAt, step.endsAt),
  }));

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_420px]">
      <div className="space-y-8">
        <section className="rounded-xl border border-outline-variant bg-card p-8 elevation-1">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-outline-variant pb-5">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                {jobPosting.publicKey}
              </p>
              <h1 className="mt-3 font-headline text-4xl font-bold tracking-[-0.02em] text-on-surface">
                {jobPosting.title}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-surface-container-low px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-on-surface ring-1 ring-inset ring-outline-variant">
                  {getRecruitmentCategoryLabel(jobPosting.recruitmentCategory)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] ring-1 ring-inset ${
                    jobPosting.recruitmentMode === "ROLLING"
                      ? "bg-brand/10 text-brand ring-brand/20"
                      : "bg-surface-container text-on-surface-variant ring-outline-variant"
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

        <section className="rounded-xl border border-outline-variant bg-card p-8 elevation-1">
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant pb-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                전형
              </p>
              <h2 className="mt-3 font-headline text-2xl font-semibold tracking-[-0.015em] text-on-surface">
                채용 단계
              </h2>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              총 {jobPosting.steps.length}단계
            </span>
          </div>

          <div className="mt-8">
            <RecruitmentStepper steps={stepperSteps} orientation="vertical" />
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">{applicationSlot}</aside>
    </div>
  );
}
