import type {
  AdminApplicantFilters,
  ApplicationReviewStatus,
} from "@/entities/admin/applicant-model";
import type { ApplicationStatus } from "@/entities/recruitment/model";
import { AdminApplicantTable } from "@/features/admin/applicants/AdminApplicantTable";
import { getAdminApplicants } from "@/shared/api/admin-applicants";
import { getJobPostings } from "@/shared/api/recruitment";

const selectClassName =
  "mt-2 w-full rounded-sm border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:bg-card";

const inputClassName =
  "mt-2 w-full rounded-sm border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:bg-card";

const fieldLabelClassName =
  "text-[11px] font-semibold tracking-[0.06em] text-on-surface";

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

  return (
    <div className="space-y-5">
      <form className="rounded-sm border border-outline-variant bg-card px-4 py-4 shadow-[0_10px_30px_-24px_rgba(31,41,55,0.22)]">
        <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto]">
          <label className={fieldLabelClassName}>
            공고
            <select
              name="jobPostingId"
              defaultValue={normalizedFilters.jobPostingId?.toString() ?? ""}
              className={selectClassName}
            >
              <option value="">전체</option>
              {jobPostings.map((jobPosting) => (
                <option key={jobPosting.id} value={jobPosting.id}>
                  {jobPosting.title}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldLabelClassName}>
            지원 상태
            <select
              name="applicationStatus"
              defaultValue={normalizedFilters.applicationStatus ?? ""}
              className={selectClassName}
            >
              <option value="">전체</option>
              <option value="DRAFT">임시 저장</option>
              <option value="SUBMITTED">제출 완료</option>
            </select>
          </label>

          <label className={fieldLabelClassName}>
            검토 상태
            <select
              name="reviewStatus"
              defaultValue={normalizedFilters.reviewStatus ?? ""}
              className={selectClassName}
            >
              <option value="">전체</option>
              <option value="NEW">신규</option>
              <option value="IN_REVIEW">검토 중</option>
              <option value="PASSED">통과</option>
              <option value="REJECTED">불합격</option>
            </select>
          </label>

          <label className={fieldLabelClassName}>
            지원자명
            <input
              name="applicantName"
              defaultValue={normalizedFilters.applicantName ?? ""}
              className={inputClassName}
              placeholder="이름"
            />
          </label>

          <label className={fieldLabelClassName}>
            이메일
            <input
              name="applicantEmail"
              defaultValue={normalizedFilters.applicantEmail ?? ""}
              className={inputClassName}
              placeholder="이메일"
            />
          </label>

          <label className={fieldLabelClassName}>
            연락처
            <input
              name="applicantPhone"
              defaultValue={normalizedFilters.applicantPhone ?? ""}
              className={inputClassName}
              placeholder="연락처"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-sm bg-primary px-4 py-2.5 text-xs font-medium tracking-[0.12em] text-primary-foreground transition-colors hover:bg-[#7a2451]"
            >
              조회
            </button>
          </div>
        </div>
      </form>

      <AdminApplicantTable applicants={applicants} />
    </div>
  );
}
