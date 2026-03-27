import Link from "next/link";

import type {
  AdminApplicantFilters,
  ApplicationReviewStatus,
} from "@/entities/admin/applicant-model";
import type { ApplicationStatus } from "@/entities/recruitment/model";
import { AdminApplicantTable } from "@/features/admin/applicants/AdminApplicantTable";
import { getAdminApplicants } from "@/shared/api/admin-applicants";
import { getJobPostings } from "@/shared/api/recruitment";

const PAGE_SIZE = 30;
const selectClassName =
  "mt-2 w-full border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20";

const inputClassName =
  "mt-2 w-full border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20";

const fieldLabelClassName =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant";

function buildApplicantsHref(filters: AdminApplicantFilters, targetPage: number) {
  const query = new URLSearchParams();

  if (filters.jobPostingId) {
    query.set("jobPostingId", String(filters.jobPostingId));
  }
  if (filters.applicationStatus) {
    query.set("applicationStatus", filters.applicationStatus);
  }
  if (filters.reviewStatus) {
    query.set("reviewStatus", filters.reviewStatus);
  }
  if (filters.applicantName) {
    query.set("applicantName", filters.applicantName);
  }
  if (filters.applicantEmail) {
    query.set("applicantEmail", filters.applicantEmail);
  }
  if (filters.applicantPhone) {
    query.set("applicantPhone", filters.applicantPhone);
  }
  if (filters.query) {
    query.set("query", filters.query);
  }
  if (targetPage > 1) {
    query.set("page", String(targetPage));
  }

  const queryString = query.toString();
  return queryString ? `/admin/applicants?${queryString}` : "/admin/applicants";
}

function PaginationLinks({
  currentPage,
  totalPages,
  filters,
  summary,
}: {
  currentPage: number;
  totalPages: number;
  filters: AdminApplicantFilters;
  summary: string;
}) {
  if (totalPages <= 1) {
    return <p className="text-sm text-on-surface-variant">{summary}</p>;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-on-surface-variant">{summary}</p>
      <div className="flex items-center gap-3">
        {currentPage <= 1 ? (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-sm border border-outline-variant px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/50">
            이전
          </span>
        ) : (
          <Link
            href={buildApplicantsHref(filters, currentPage - 1)}
            className="inline-flex items-center justify-center rounded-sm border border-outline px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            이전
          </Link>
        )}
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">
          {currentPage} / {totalPages}
        </span>
        {currentPage >= totalPages ? (
          <span className="inline-flex cursor-not-allowed items-center justify-center rounded-sm border border-outline-variant px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant/50">
            다음
          </span>
        ) : (
          <Link
            href={buildApplicantsHref(filters, currentPage + 1)}
            className="inline-flex items-center justify-center rounded-sm border border-outline px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            다음
          </Link>
        )}
      </div>
    </div>
  );
}

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
  const requestedPage = filters.page ? Number(filters.page) : 1;
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const normalizedFilters: AdminApplicantFilters = {
    jobPostingId:
      jobPostingId && Number.isInteger(jobPostingId) ? jobPostingId : undefined,
    applicationStatus: filters.applicationStatus,
    reviewStatus: filters.reviewStatus,
    applicantName: filters.applicantName?.trim() || undefined,
    applicantEmail: filters.applicantEmail?.trim() || undefined,
    applicantPhone: filters.applicantPhone?.trim() || undefined,
    query: filters.query?.trim() || undefined,
    page,
    size: PAGE_SIZE,
  };

  const [applicantPage, jobPostings] = await Promise.all([
    getAdminApplicants(normalizedFilters),
    getJobPostings().catch(() => []),
  ]);

  const applicants = applicantPage.items;
  const currentPage = applicantPage.page;
  const totalPages = Math.max(applicantPage.totalPages, 1);
  const startItem = applicantPage.totalItems === 0 ? 0 : (currentPage - 1) * applicantPage.size + 1;
  const endItem = applicantPage.totalItems === 0 ? 0 : startItem + applicants.length - 1;
  const submittedCount = applicants.filter(
    (applicant) => applicant.applicationStatus === "SUBMITTED",
  ).length;
  const passedCount = applicants.filter(
    (applicant) => applicant.reviewStatus === "PASSED",
  ).length;
  const summary =
    applicantPage.totalItems === 0
      ? "현재 조건에 맞는 지원자가 없습니다."
      : `${startItem}-${endItem} / ${applicantPage.totalItems}명 표시 중`;

  return (
    <div className="space-y-6">
      <form className="border border-outline-variant bg-card px-5 py-5 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.25)]">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto]">
          <label className={`${fieldLabelClassName} xl:col-span-2`}>
            통합 검색
            <input
              name="query"
              defaultValue={normalizedFilters.query ?? ""}
              className={inputClassName}
              placeholder="지원자 이름, 이메일, 전화번호, 공고명으로 검색"
            />
          </label>

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
              <option value="NEW">접수 대기</option>
              <option value="IN_REVIEW">검토 중</option>
              <option value="PASSED">합격</option>
              <option value="REJECTED">불합격</option>
            </select>
          </label>

          <label className={fieldLabelClassName}>
            지원자 이름
            <input
              name="applicantName"
              defaultValue={normalizedFilters.applicantName ?? ""}
              className={inputClassName}
              placeholder="이름 입력"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full border border-primary bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              필터 적용
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={fieldLabelClassName}>
            지원자 이메일
            <input
              name="applicantEmail"
              defaultValue={normalizedFilters.applicantEmail ?? ""}
              className={inputClassName}
              placeholder="name@example.com"
            />
          </label>

          <label className={fieldLabelClassName}>
            지원자 휴대전화
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
              지원자 목록
            </p>
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
              지원자 현황
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard label="페이지 결과" value={applicants.length} />
            <StatCard label="전체 인원" value={applicantPage.totalItems} />
            <StatCard label="페이지" value={`${currentPage}/${totalPages}`} />
            <StatCard label="제출/합격" value={`${submittedCount}/${passedCount}`} />
          </div>
        </div>

        <div className="border-b border-outline-variant px-6 py-5">
          <PaginationLinks
            currentPage={currentPage}
            totalPages={totalPages}
            filters={normalizedFilters}
            summary={summary}
          />
        </div>

        <AdminApplicantTable applicants={applicants} />

        <div className="border-t border-outline-variant px-6 py-5">
          <PaginationLinks
            currentPage={currentPage}
            totalPages={totalPages}
            filters={normalizedFilters}
            summary={summary}
          />
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
