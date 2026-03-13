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
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-black/8 bg-white/84 p-8 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getJobPostingStatusClassName(jobPosting.status)}`}
            >
              {getJobPostingStatusLabel(jobPosting.status)}
            </span>
            <span className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
              {jobPosting.publicKey}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-stone-950 md:text-5xl">
              {jobPosting.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
              {jobPosting.headline}
            </p>
          </div>

          <dl className="mt-8 grid gap-4 rounded-[1.75rem] bg-stone-950 px-5 py-5 text-sm text-stone-100 md:grid-cols-3">
            <div>
              <dt className="text-stone-400">Employment</dt>
              <dd className="mt-1 font-medium">{jobPosting.employmentType}</dd>
            </div>
            <div>
              <dt className="text-stone-400">Location</dt>
              <dd className="mt-1 font-medium">{jobPosting.location}</dd>
            </div>
            <div>
              <dt className="text-stone-400">Apply window</dt>
              <dd className="mt-1 font-medium">
                {formatDateRange(jobPosting.opensAt, jobPosting.closesAt)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[2rem] border border-black/8 bg-white/78 p-8 shadow-[0_18px_60px_rgba(43,35,18,0.06)]">
          <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
            Position Overview
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
            Role summary
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-8 text-stone-700 md:text-base">
            {jobPosting.description}
          </p>
        </section>

        <section className="rounded-[2rem] border border-black/8 bg-white/78 p-8 shadow-[0_18px_60px_rgba(43,35,18,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
                Recruitment Flow
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                Hiring steps
              </h2>
            </div>
            <p className="text-sm text-stone-500">{jobPosting.steps.length} steps</p>
          </div>

          <ol className="mt-6 space-y-4">
            {jobPosting.steps.map((step) => (
              <li
                key={`${jobPosting.id}-${step.stepOrder}`}
                className="grid gap-4 rounded-[1.5rem] border border-stone-200 bg-stone-50 px-5 py-5 md:grid-cols-[84px_1fr]"
              >
                <div className="flex items-center gap-3 md:block">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary">
                    {step.stepOrder}
                  </div>
                  <span className="text-sm font-medium text-stone-500">
                    {getStepTypeLabel(step.stepType)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-stone-700">
                    {step.description}
                  </p>
                  <p className="mt-3 text-sm text-stone-500">
                    {formatDateRange(step.startsAt, step.endsAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">{applicationSlot}</aside>
    </div>
  );
}
