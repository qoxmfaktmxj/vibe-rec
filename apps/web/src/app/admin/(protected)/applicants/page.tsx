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
  "mt-2 w-full border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:bg-card";

const inputClassName =
  "mt-2 w-full border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:bg-card";

const fieldLabelClassName =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant";

export default async function AdminApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    jobPostingId?: string;
    applicationStatus?: ApplicationStatus;
    reviewStatus?: ApplicationReviewStatus;
    applicantName?: string;
    applicantEmail?: string;
    applicantPhone?: string;
    query?: string;
    page?: string;
  }>;
}) {
  const filters = await searchParams;
  const jobPostingId = filters.jobPostingId
    ? Number(filters.jobPostingId)
    : undefined;
  const page = filters.page ? Number(filters.page) : 1;

  const normalizedFilters: AdminApplicantFilters = {
    jobPostingId:
      jobPostingId && Number.isInteger(jobPostingId) ? jobPostingId : undefined,
    applicationStatus: filters.applicationStatus,
    reviewStatus: filters.reviewStatus,
    applicantName: filters.applicantName?.trim() || undefined,
    applicantEmail: filters.applicantEmail?.trim() || undefined,
    applicantPhone: filters.applicantPhone?.trim() || undefined,
    query: filters.query?.trim() || undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    size: 50,
  };

  const [applicantPage, jobPostings] = await Promise.all([
    getAdminApplicants(normalizedFilters),
    getJobPostings().catch(() => []),
  ]);

  const applicants = applicantPage.items;
  const currentPage = applicantPage.page;
  const totalPages = Math.max(applicantPage.totalPages, 1);
  const submittedCount = applicants.filter(
    (applicant) => applicant.applicationStatus === "SUBMITTED",
  ).length;
  const passedCount = applicants.filter(
    (applicant) => applicant.reviewStatus === "PASSED",
  ).length;
  const paginationHref = (targetPage: number) => {
    const query = new URLSearchParams();

    if (normalizedFilters.jobPostingId) {
      query.set("jobPostingId", String(normalizedFilters.jobPostingId));
    }
    if (normalizedFilters.applicationStatus) {
      query.set("applicationStatus", normalizedFilters.applicationStatus);
    }
    if (normalizedFilters.reviewStatus) {
      query.set("reviewStatus", normalizedFilters.reviewStatus);
    }
    if (normalizedFilters.applicantName) {
      query.set("applicantName", normalizedFilters.applicantName);
    }
    if (normalizedFilters.applicantEmail) {
      query.set("applicantEmail", normalizedFilters.applicantEmail);
    }
    if (normalizedFilters.applicantPhone) {
      query.set("applicantPhone", normalizedFilters.applicantPhone);
    }
    if (normalizedFilters.query) {
      query.set("query", normalizedFilters.query);
    }
    if (targetPage > 1) {
      query.set("page", String(targetPage));
    }

    const queryString = query.toString();
    return queryString ? `/admin/applicants?${queryString}` : "/admin/applicants";
  };

  return (
    <div className="space-y-6">
      <form className="border border-outline-variant bg-card px-5 py-5 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.25)]">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto]">
          <label className={`${fieldLabelClassName} xl:col-span-2`}>
            Search
            <input
              name="query"
              defaultValue={normalizedFilters.query ?? ""}
              className={inputClassName}
              placeholder="Search by applicant, email, phone, or posting"
            />
          </label>

          <label className={fieldLabelClassName}>
            Posting
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

          <label className={fieldLabelClassName}>
            Application
            <select
              name="applicationStatus"
              defaultValue={normalizedFilters.applicationStatus ?? ""}
              className={selectClassName}
            >
              <option value="">All</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
            </select>
          </label>

          <label className={fieldLabelClassName}>
            Review
            <select
              name="reviewStatus"
              defaultValue={normalizedFilters.reviewStatus ?? ""}
              className={selectClassName}
            >
              <option value="">All</option>
              <option value="NEW">New</option>
              <option value="IN_REVIEW">In review</option>
              <option value="PASSED">Passed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>

          <label className={fieldLabelClassName}>
            Applicant name
            <input
              name="applicantName"
              defaultValue={normalizedFilters.applicantName ?? ""}
              className={inputClassName}
              placeholder="Jane Kim"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full border border-primary bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Apply filters
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={fieldLabelClassName}>
            Applicant email
            <input
              name="applicantEmail"
              defaultValue={normalizedFilters.applicantEmail ?? ""}
              className={inputClassName}
              placeholder="name@example.com"
            />
          </label>

          <label className={fieldLabelClassName}>
            Applicant phone
            <input
              name="applicantPhone"
              defaultValue={normalizedFilters.applicantPhone ?? ""}
              className={inputClassName}
              placeholder="010-1234-5678"
            />
          </label>
        </div>
      </form>

      <section className="border border-outline-variant bg-card">
        <div className="flex flex-col gap-4 border-b border-outline-variant px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
              Applicants
            </p>
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
              Applicant list
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Results" value={applicants.length} />
            <StatCard label="Total results" value={applicantPage.totalItems} />
            <StatCard label="Page" value={`${currentPage} / ${totalPages}`} />
            <StatCard label="Submitted / Passed" value={`${submittedCount} / ${passedCount}`} />
          </div>
        </div>

        <AdminApplicantTable applicants={applicants} />

        <div className="flex flex-col gap-3 border-t border-outline-variant px-6 py-5 text-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {applicants.length} of {applicantPage.totalItems} applicants.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={currentPage > 1 ? paginationHref(currentPage - 1) : paginationHref(1)}
              aria-disabled={currentPage <= 1}
              className={`inline-flex items-center justify-center rounded-sm border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                currentPage <= 1
                  ? "cursor-not-allowed border-outline-variant text-on-surface-variant/50"
                  : "border-outline text-on-surface hover:border-primary hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              Previous
            </Link>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">
              Page {currentPage} of {totalPages}
            </span>
            <Link
              href={
                currentPage < totalPages
                  ? paginationHref(currentPage + 1)
                  : paginationHref(totalPages)
              }
              aria-disabled={currentPage >= totalPages}
              className={`inline-flex items-center justify-center rounded-sm border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                currentPage >= totalPages
                  ? "cursor-not-allowed border-outline-variant text-on-surface-variant/50"
                  : "border-outline text-on-surface hover:border-primary hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="min-w-[140px] border border-outline-variant bg-surface-container-lowest px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-3 font-headline text-3xl font-semibold tracking-[-0.05em] text-on-surface">
        {value}
      </p>
    </div>
  );
}
