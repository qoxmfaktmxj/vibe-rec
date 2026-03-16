import Link from "next/link";

import type {
  AdminApplicantFilters,
  ApplicationReviewStatus,
} from "@/entities/admin/applicant-model";
import type { ApplicationStatus } from "@/entities/recruitment/model";
import { AdminApplicantTable } from "@/features/admin/applicants/AdminApplicantTable";
import { getAdminApplicants } from "@/shared/api/admin-applicants";
import { getJobPostings } from "@/shared/api/recruitment";

interface AdminApplicantsPageProps {
  searchParams: Promise<{
    jobPostingId?: string;
    applicationStatus?: ApplicationStatus;
    reviewStatus?: ApplicationReviewStatus;
    query?: string;
  }>;
}

const selectClassName =
  "mt-2 w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

export default async function AdminApplicantsPage({
  searchParams,
}: AdminApplicantsPageProps) {
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
      {/* Header + Filters */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <h1 className="font-headline text-3xl font-bold text-on-surface">
            지원자 관리
          </h1>
          <p className="mt-4 text-sm leading-7 text-on-surface-variant">
            공고, 제출 상태, 검토 상태, 이름/이메일 검색으로 현재 지원서를 빠르게
            좁힐 수 있습니다.
          </p>
        </div>

        <form className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <p className="text-sm font-semibold text-on-surface-variant">
            필터
          </p>
          <div className="mt-4 grid gap-4">
            <label className="text-sm font-semibold text-on-surface-variant">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-on-surface-variant">
                지원 상태
                <select
                  name="applicationStatus"
                  defaultValue={normalizedFilters.applicationStatus ?? ""}
                  className={selectClassName}
                >
                  <option value="">전체</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-on-surface-variant">
                검토 상태
                <select
                  name="reviewStatus"
                  defaultValue={normalizedFilters.reviewStatus ?? ""}
                  className={selectClassName}
                >
                  <option value="">전체</option>
                  <option value="NEW">NEW</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="PASSED">PASSED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </label>
            </div>

            <label className="text-sm font-semibold text-on-surface-variant">
              이름/이메일 검색
              <input
                name="query"
                defaultValue={normalizedFilters.query ?? ""}
                className="mt-2 w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                placeholder="예: kim, example.com"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            >
              조회
            </button>
            <Link
              href="/admin/applicants"
              className="rounded-lg bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
            >
              초기화
            </Link>
          </div>
        </form>
      </div>

      <AdminApplicantTable applicants={applicants} />
    </div>
  );
}
