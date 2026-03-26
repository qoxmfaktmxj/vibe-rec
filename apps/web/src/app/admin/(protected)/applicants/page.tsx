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
      <form className="border border-outline-variant bg-card px-5 py-5 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.25)]">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto]">
          <label className={`${fieldLabelClassName} xl:col-span-2`}>
            ?듯빀 寃??
            <input
              name="query"
              defaultValue={normalizedFilters.query ?? ""}
              className={inputClassName}
              placeholder="?대쫫, ?대찓?? ?꾪솕踰덊샇, 怨듦퀬紐낆쑝濡?寃??
            />
          </label>

          <label className={fieldLabelClassName}>
            怨듦퀬
            <select
              name="jobPostingId"
              defaultValue={normalizedFilters.jobPostingId?.toString() ?? ""}
              className={selectClassName}
            >
              <option value="">?꾩껜</option>
              {jobPostings.map((jobPosting) => (
                <option key={jobPosting.id} value={jobPosting.id}>
                  {jobPosting.title}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldLabelClassName}>
            吏???곹깭
            <select
              name="applicationStatus"
              defaultValue={normalizedFilters.applicationStatus ?? ""}
              className={selectClassName}
            >
              <option value="">?꾩껜</option>
              <option value="DRAFT">?꾩떆 ???/option>
              <option value="SUBMITTED">?쒖텧 ?꾨즺</option>
            </select>
          </label>

          <label className={fieldLabelClassName}>
            寃???곹깭
            <select
              name="reviewStatus"
              defaultValue={normalizedFilters.reviewStatus ?? ""}
              className={selectClassName}
            >
              <option value="">?꾩껜</option>
              <option value="NEW">?좉퇋</option>
              <option value="IN_REVIEW">寃??以?/option>
              <option value="PASSED">?⑷꺽</option>
              <option value="REJECTED">遺덊빀寃?/option>
            </select>
          </label>

          <label className={fieldLabelClassName}>
            吏?먯옄紐?
            <input
              name="applicantName"
              defaultValue={normalizedFilters.applicantName ?? ""}
              className={inputClassName}
              placeholder="?대쫫"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full border border-primary bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              ?꾪꽣 ?곸슜
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={fieldLabelClassName}>
            ?대찓??
            <input
              name="applicantEmail"
              defaultValue={normalizedFilters.applicantEmail ?? ""}
              className={inputClassName}
              placeholder="name@example.com"
            />
          </label>

          <label className={fieldLabelClassName}>
            ?꾪솕踰덊샇
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
              吏?먯옄 紐⑸줉
            </p>
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
              ?꾩옱 吏?먯옄
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="議고쉶??吏?먯옄" value={applicants.length} />
            <StatCard label="?쒖텧 ?꾨즺" value={submittedCount} />
            <StatCard label="寃??以?/ ?⑷꺽" value={`${inReviewCount} / ${passedCount}`} />
          </div>
        </div>

        <AdminApplicantTable applicants={applicants} />
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

