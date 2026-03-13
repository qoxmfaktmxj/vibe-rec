import Link from "next/link";

import type { JobPostingSummary } from "@/entities/recruitment/model";
import {
  formatDateRange,
  getJobPostingStatusClassName,
  getJobPostingStatusLabel,
} from "@/shared/lib/recruitment";

interface JobPostingListProps {
  jobPostings: JobPostingSummary[];
}

export function JobPostingList({ jobPostings }: JobPostingListProps) {
  if (jobPostings.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white/70 p-10 text-center text-sm text-stone-600">
        No job postings are available yet.
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      {jobPostings.map((jobPosting) => (
        <article
          key={jobPosting.id}
          className="group flex h-full flex-col justify-between rounded-[2rem] border border-black/8 bg-white/82 p-7 shadow-[0_20px_50px_rgba(43,35,18,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(43,35,18,0.12)]"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
                  {jobPosting.employmentType} - {jobPosting.location}
                </p>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                    {jobPosting.title}
                  </h2>
                  <p className="max-w-xl text-sm leading-7 text-stone-700">
                    {jobPosting.headline}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getJobPostingStatusClassName(jobPosting.status)}`}
              >
                {getJobPostingStatusLabel(jobPosting.status)}
              </span>
            </div>

            <dl className="grid gap-3 rounded-[1.5rem] bg-stone-950 px-5 py-4 text-sm text-stone-100 sm:grid-cols-3">
              <div>
                <dt className="text-stone-400">Posting key</dt>
                <dd className="mt-1 font-medium">{jobPosting.publicKey}</dd>
              </div>
              <div>
                <dt className="text-stone-400">Apply window</dt>
                <dd className="mt-1 font-medium">
                  {formatDateRange(jobPosting.opensAt, jobPosting.closesAt)}
                </dd>
              </div>
              <div>
                <dt className="text-stone-400">Steps</dt>
                <dd className="mt-1 font-medium">{jobPosting.stepCount}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-stone-500">
              Review the posting details and test draft save from the next
              screen.
            </p>
            <Link
              href={`/job-postings/${jobPosting.id}`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              View details
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
