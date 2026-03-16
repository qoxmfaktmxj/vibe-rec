import type { ReactNode } from "react";

import type { JobPostingDetail } from "@/entities/recruitment/model";
import {
  formatDateRange,
  getJobPostingStatusClassName,
  getJobPostingStatusLabel,
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
    <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
      <div className="space-y-8">
        {/* Header */}
        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getJobPostingStatusClassName(jobPosting.status)}`}
            >
              {getJobPostingStatusLabel(jobPosting.status)}
            </span>
            <span className="text-xs font-medium uppercase tracking-widest text-outline">
              {jobPosting.publicKey}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
              {jobPosting.title}
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-on-surface-variant">
              {jobPosting.headline}
            </p>
          </div>

          <div className="mt-8 grid gap-4 rounded-xl bg-surface-container-low px-6 py-5 text-sm md:grid-cols-3">
            <div>
              <dt className="font-semibold text-on-surface-variant">
                Employment
              </dt>
              <dd className="mt-1 font-medium text-on-surface">
                {jobPosting.employmentType}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-on-surface-variant">
                Location
              </dt>
              <dd className="mt-1 font-medium text-on-surface">
                {jobPosting.location}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-on-surface-variant">
                Apply window
              </dt>
              <dd className="mt-1 font-medium text-on-surface">
                {formatDateRange(jobPosting.opensAt, jobPosting.closesAt)}
              </dd>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <h2 className="font-headline text-2xl font-bold text-on-surface">
            Role Summary
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-8 text-on-surface-variant md:text-base">
            {jobPosting.description}
          </p>
        </section>

        {/* Steps */}
        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Hiring Steps
            </h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {jobPosting.steps.length} steps
            </span>
          </div>

          <ol className="mt-6 space-y-4">
            {jobPosting.steps.map((step) => (
              <li
                key={`${jobPosting.id}-${step.stepOrder}`}
                className="grid gap-4 rounded-xl bg-surface-container-low px-6 py-5 md:grid-cols-[84px_1fr]"
              >
                <div className="flex items-center gap-3 md:block">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 font-headline font-bold text-primary">
                    {step.stepOrder}
                  </div>
                  <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-outline">
                    {getStepTypeLabel(step.stepType)}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                    {step.description}
                  </p>
                  <p className="mt-3 text-xs text-outline">
                    {formatDateRange(step.startsAt, step.endsAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        {applicationSlot}
      </aside>
    </div>
  );
}
