import Link from "next/link";

import type {
  AdminApplicantFilters,
  ApplicationReviewStatus,
} from "@/entities/admin/applicant-model";
import type { ApplicationStatus } from "@/entities/recruitment/model";
import { AdminApplicantTable } from "@/features/admin/applicants/AdminApplicantTable";
import { getAdminApplicants } from "@/shared/api/admin-applicants";
import { getJobPostings } from "@/shared/api/recruitment";

const selectClassName =
  "mt-2 w-full rounded-sm border border-outline-variant bg-card px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary";

export default async function AdminApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    jobPostingId?: string;
    applicationStatus?: ApplicationStatus;
    reviewStatus?: ApplicationReviewStatus;
    query?: string;
  }>;
}) {
  const filters = await searchParams;
  const jobPostingId = filters.jobPostingId
    ? Number(filters.jobPostingId)
    : undefined;
  const normalizedFilters: AdminApplicantFilters = {
    jobPostingId:
      jobPostingId && Number.isInteger(jobPostingId) ? jobPostingId : undefined,
    applicationStatus: filters.applicationStatus,
    reviewStatus: filters.reviewStatus,
    query: filters.query?.trim() ? filters.query.trim() : undefined,
  };

  const [applicants, jobPostings] = await Promise.all([
    getAdminApplicants(normalizedFilters),
    getJobPostings(),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form className="rounded-sm border border-outline-variant bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
            Filters
          </p>
          <div className="mt-5 grid gap-4">
            <label className="text-sm text-on-surface-variant">
              Job posting
              <select
                name="jobPostingId"
                defaultValue={normalizedFilters.jobPostingId?.toString() ?? ""}
                className={selectClassName}
              >
                <option value="">All</option>
                {jobPostings.map((jobPosting) => (
                  <option key={jobPosting.id} value={jobPosting.id}>
                    {jobPosting.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-on-surface-variant">
              Application
              <select
                name="applicationStatus"
                defaultValue={normalizedFilters.applicationStatus ?? ""}
                className={selectClassName}
              >
                <option value="">All</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SUBMITTED">SUBMITTED</option>
              </select>
            </label>

            <label className="text-sm text-on-surface-variant">
              Review
              <select
                name="reviewStatus"
                defaultValue={normalizedFilters.reviewStatus ?? ""}
                className={selectClassName}
              >
                <option value="">All</option>
                <option value="NEW">NEW</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="PASSED">PASSED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </label>

            <label className="text-sm text-on-surface-variant">
              Search
              <input
                name="query"
                defaultValue={normalizedFilters.query ?? ""}
                className="mt-2 w-full rounded-sm border border-outline-variant bg-card px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                placeholder="name or email"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground"
            >
              Apply
            </button>
            <Link
              href="/admin/applicants"
              className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
            >
              Reset
            </Link>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-sm border border-outline-variant bg-card px-6 py-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              Applicants
            </p>
            <h1 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
              Review the current pipeline at a glance.
            </h1>
          </div>
          <AdminApplicantTable applicants={applicants} />
        </div>
      </div>
    </div>
  );
}
