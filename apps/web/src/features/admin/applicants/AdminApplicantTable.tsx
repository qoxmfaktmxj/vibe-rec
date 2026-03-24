import Link from "next/link";

import type {
  AdminApplicantSummary,
  ApplicationReviewStatus,
} from "@/entities/admin/applicant-model";
import type { ApplicationStatus } from "@/entities/recruitment/model";
import { formatDateTime } from "@/shared/lib/recruitment";

interface AdminApplicantTableProps {
  applicants: AdminApplicantSummary[];
}

function getApplicationStatusMeta(status: ApplicationStatus) {
  switch (status) {
    case "SUBMITTED":
      return {
        label: "제출 완료",
        className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      };
    case "DRAFT":
      return {
        label: "임시 저장",
        className: "bg-amber-50 text-amber-800 ring-amber-200",
      };
    default:
      return {
        label: status,
        className: "bg-stone-100 text-stone-700 ring-stone-200",
      };
  }
}

function getReviewStatusMeta(status: ApplicationReviewStatus) {
  switch (status) {
    case "NEW":
      return {
        label: "신규",
        className: "bg-primary-container text-primary ring-primary/10",
      };
    case "IN_REVIEW":
      return {
        label: "검토 중",
        className: "bg-sky-50 text-sky-800 ring-sky-200",
      };
    case "PASSED":
      return {
        label: "통과",
        className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      };
    case "REJECTED":
      return {
        label: "불합격",
        className: "bg-rose-50 text-rose-800 ring-rose-200",
      };
    default:
      return {
        label: status,
        className: "bg-stone-100 text-stone-700 ring-stone-200",
      };
  }
}

export function AdminApplicantTable({
  applicants,
}: AdminApplicantTableProps) {
  if (applicants.length === 0) {
    return (
      <section className="rounded-sm border border-outline-variant bg-card p-10 text-center text-sm text-on-surface-variant">
        현재 필터 조건에 맞는 지원자가 없습니다.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-sm border border-outline-variant bg-card shadow-[0_10px_30px_-24px_rgba(31,41,55,0.28)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-container">
            <tr className="border-b border-outline text-[12px] font-semibold tracking-[0.01em] text-on-surface">
              <th className="px-6 py-3.5">지원자</th>
              <th className="px-6 py-3.5">공고</th>
              <th className="px-6 py-3.5">상태</th>
              <th className="px-6 py-3.5">검토 상태</th>
              <th className="px-6 py-3.5">갱신 시각</th>
              <th className="px-6 py-3.5 text-right">열기</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant) => {
              const applicationStatus = getApplicationStatusMeta(
                applicant.applicationStatus,
              );
              const reviewStatus = getReviewStatusMeta(applicant.reviewStatus);

              return (
                <tr
                  key={applicant.applicationId}
                  className="border-b border-outline-variant transition-colors hover:bg-surface-container-low/70 last:border-b-0"
                >
                  <td className="px-6 py-5 align-top">
                    <p className="font-headline text-base font-medium tracking-[-0.03em] text-on-surface">
                      {applicant.applicantName}
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {applicant.applicantEmail}
                    </p>
                    <p className="mt-1 font-mono text-[11px] tracking-[0.08em] text-on-surface-variant">
                      {applicant.applicantPhone}
                    </p>
                  </td>
                  <td className="px-6 py-5 align-top text-sm font-medium text-on-surface">
                    {applicant.jobPostingTitle}
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span
                      className={`inline-flex min-w-[88px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${applicationStatus.className}`}
                    >
                      {applicationStatus.label}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span
                      className={`inline-flex min-w-[88px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${reviewStatus.className}`}
                    >
                      {reviewStatus.label}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top text-sm text-on-surface-variant">
                    {formatDateTime(
                      applicant.submittedAt ?? applicant.draftSavedAt,
                    )}
                  </td>
                  <td className="px-6 py-5 text-right align-top">
                    <Link
                      href={`/admin/applicants/${applicant.applicationId}`}
                      className="inline-flex rounded-sm border border-on-surface px-3 py-2 text-xs font-medium tracking-[0.06em] text-on-surface transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      보기
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
