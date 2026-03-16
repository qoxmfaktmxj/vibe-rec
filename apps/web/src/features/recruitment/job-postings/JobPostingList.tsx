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
      <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-10 text-center text-sm text-on-surface-variant">
        No job postings are available yet.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {jobPostings.map((jobPosting) => (
        <article
          key={jobPosting.id}
          className="ambient-shadow group flex flex-col items-start justify-between gap-6 rounded-xl bg-surface-container-lowest p-8 transition-all hover:bg-surface-container-lowest md:flex-row md:items-center"
        >
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-surface-container-highest">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 font-headline text-xl font-bold">
                {jobPosting.title}
              </h3>
              <p className="flex items-center gap-2 font-medium text-on-surface-variant">
                {jobPosting.employmentType} &bull; {jobPosting.location}
              </p>
              {jobPosting.headline ? (
                <p className="mt-1 max-w-lg text-sm text-on-surface-variant">
                  {jobPosting.headline}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getJobPostingStatusClassName(jobPosting.status)}`}
              >
                {getJobPostingStatusLabel(jobPosting.status)}
              </span>
              <p className="mt-1 text-xs text-on-surface-variant">
                {formatDateRange(jobPosting.opensAt, jobPosting.closesAt)}
              </p>
              <p className="text-xs text-on-surface-variant">
                {jobPosting.stepCount} steps
              </p>
            </div>
            <Link
              href={`/job-postings/${jobPosting.id}`}
              className="rounded-lg bg-gradient-primary px-6 py-3 font-bold text-white transition-all hover:opacity-90"
            >
              View Details
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
