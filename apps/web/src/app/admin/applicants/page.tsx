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

export default async function AdminApplicantsPage({
  searchParams,
}: AdminApplicantsPageProps) {
  const filters = await searchParams;
  const jobPostingId = filters.jobPostingId ? Number(filters.jobPostingId) : undefined;
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
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[2rem] border border-black/8 bg-white/84 p-7 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
          <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
            Applicant Management
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
            지원자 목록
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            공고, 제출 상태, 검토 상태, 이름/이메일 검색으로 현재 지원서를 빠르게
            좁힐 수 있다.
          </p>
        </article>

        <form className="rounded-[2rem] border border-black/8 bg-white/84 p-7 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
          <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
            Filters
          </p>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-medium text-stone-700">
              공고
              <select
                name="jobPostingId"
                defaultValue={normalizedFilters.jobPostingId?.toString() ?? ""}
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="">전체</option>
                {jobPostings.map((jobPosting) => (
                  <option key={jobPosting.id} value={jobPosting.id}>
                    {jobPosting.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-stone-700">
              지원 상태
              <select
                name="applicationStatus"
                defaultValue={normalizedFilters.applicationStatus ?? ""}
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="">전체</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SUBMITTED">SUBMITTED</option>
              </select>
            </label>

            <label className="text-sm font-medium text-stone-700">
              검토 상태
              <select
                name="reviewStatus"
                defaultValue={normalizedFilters.reviewStatus ?? ""}
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="">전체</option>
                <option value="NEW">NEW</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="PASSED">PASSED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </label>

            <label className="text-sm font-medium text-stone-700">
              이름/이메일 검색
              <input
                name="query"
                defaultValue={normalizedFilters.query ?? ""}
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="예: kim, example.com"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              조회
            </button>
            <Link
              href="/admin/applicants"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              초기화
            </Link>
          </div>
        </form>
      </div>

      <AdminApplicantTable applicants={applicants} />
    </section>
  );
}
