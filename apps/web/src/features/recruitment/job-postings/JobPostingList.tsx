import Link from "next/link";

import type { JobPostingSummary } from "@/entities/recruitment/model";
import { formatDateRange } from "@/shared/lib/recruitment";

interface JobPostingListProps {
  jobPostings: JobPostingSummary[];
}

export function JobPostingList({ jobPostings }: JobPostingListProps) {
  if (jobPostings.length === 0) {
    return (
      <section className="rounded-sm border border-outline-variant bg-card px-8 py-14 text-center text-sm text-on-surface-variant">
        There are no active job postings right now.
      </section>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {jobPostings.map((jobPosting) => (
        <article
          key={jobPosting.id}
          className="flex h-full flex-col rounded-sm border border-outline-variant bg-card p-6"
        >
          <div className="space-y-3">
            <h3 className="font-headline text-lg font-medium tracking-[-0.03em] text-on-surface">
              {jobPosting.title}
            </h3>
            <p className="text-sm text-on-surface-variant">{jobPosting.headline}</p>
          </div>
          <div className="mt-6 space-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
            <p>{jobPosting.employmentType}</p>
            <p>{jobPosting.location}</p>
            <p>{formatDateRange(jobPosting.opensAt, jobPosting.closesAt)}</p>
            <p>{jobPosting.stepCount} steps</p>
          </div>
          <Link
            href={`/job-postings/${jobPosting.id}`}
            className="mt-auto inline-flex w-fit self-start pt-6 text-[11px] font-semibold tracking-[0.04em] text-primary transition-colors hover:text-primary-foreground"
          >
            View details
          </Link>
        </article>
      ))}
    </div>
  );
}
