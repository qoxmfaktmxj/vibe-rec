import type {
  AdminApplicantFilters,
  ApplicationReviewStatus,
} from "@/entities/admin/applicant-model";
import type { ApplicationStatus } from "@/entities/recruitment/model";
import { AdminApplicantTable } from "@/features/admin/applicants/AdminApplicantTable";
import { getAdminApplicants } from "@/shared/api/admin-applicants";
import { getJobPostings } from "@/shared/api/recruitment";

const selectClassName =
  "mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:bg-card";

const inputClassName =
  "mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:bg-card";

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
    applicantName: filters.applicantName?.trim() || undefined,
    applicantEmail: filters.applicantEmail?.trim() || undefined,
    applicantPhone: filters.applicantPhone?.trim() || undefined,
    query: filters.query?.trim() || undefined,
  };

  const [applicants, jobPostings] = await Promise.all([
    getAdminApplicants(normalizedFilters),
    getJobPostings().catch(() => []),
  ]);

  const submittedCount = applicants.filter(
    (applicant) => applicant.applicationStatus === "SUBMITTED",
  ).length;
  const inReviewCount = applicants.filter(
    (applicant) => applicant.reviewStatus === "IN_REVIEW",
  ).length;
  const passedCount = applicants.filter(
    (applicant) => applicant.reviewStatus === "PASSED",
  ).length;

  return (
    <div className="space-y-6">
      <section className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-card px-6 py-6 md:px-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
              Applicant queue
            </p>
            <div className="space-y-2">
              <h2 className="font-headline text-3xl font-semibold tracking-[-0.05em] text-on-surface">
                Review the pipeline at a glance
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                Search candidates quickly, narrow by stage, and jump straight
                into the next action that moves hiring forward.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Visible applicants" value={applicants.length} />
            <StatCard label="Submitted" value={submittedCount} />
            <StatCard label="In review / passed" value={`${inReviewCount} / ${passedCount}`} />
          </div>
        </div>
      </section>

      <form className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-card px-5 py-5 md:px-6">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto]">
          <label className={`${fieldLabelClassName} xl:col-span-2`}>
            Quick search
            <input
              name="query"
              defaultValue={normalizedFilters.query ?? ""}
              className={inputClassName}
              placeholder="Search by name, email, phone, or posting"
            />
          </label>

          <label className={fieldLabelClassName}>
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
            Applicant
            <input
              name="applicantName"
              defaultValue={normalizedFilters.applicantName ?? ""}
              className={inputClassName}
              placeholder="Name"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Apply filters
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={fieldLabelClassName}>
            Email
            <input
              name="applicantEmail"
              defaultValue={normalizedFilters.applicantEmail ?? ""}
              className={inputClassName}
              placeholder="name@example.com"
            />
          </label>

          <label className={fieldLabelClassName}>
            Phone
            <input
              name="applicantPhone"
              defaultValue={normalizedFilters.applicantPhone ?? ""}
              className={inputClassName}
              placeholder="010-1234-5678"
            />
          </label>
        </div>
      </form>

      <AdminApplicantTable applicants={applicants} />
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
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-3 font-headline text-3xl font-semibold tracking-[-0.05em] text-on-surface">
        {value}
      </p>
    </div>
  );
}
