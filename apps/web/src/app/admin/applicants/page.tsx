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
    getJobPostings().catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form className="rounded-sm border border-outline-variant bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
            필터
          </p>
          <div className="mt-5 grid gap-4">
            <label className="text-sm text-on-surface-variant">
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

            <label className="text-sm text-on-surface-variant">
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

            <label className="text-sm text-on-surface-variant">
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

            <label className="text-sm text-on-surface-variant">
              검색
              <input
                name="query"
                defaultValue={normalizedFilters.query ?? ""}
                className="mt-2 w-full rounded-sm border border-outline-variant bg-card px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary"
                placeholder="이름 또는 이메일"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground"
            >
              적용
            </button>
            <Link
              href="/admin/applicants"
              className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
            >
              초기화
            </Link>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-sm border border-outline-variant bg-card px-6 py-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              지원자
            </p>
            <h1 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
              현재 지원 파이프라인을 한눈에 확인하세요.
            </h1>
          </div>
          <AdminApplicantTable applicants={applicants} />
        </div>
      </div>
    </div>
  );
}
