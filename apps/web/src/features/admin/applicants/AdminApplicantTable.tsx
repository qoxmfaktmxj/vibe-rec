import Link from "next/link";

import type {
  AdminApplicantSummary,
} from "@/entities/admin/applicant-model";
import {
  formatDateTime,
  getApplicationReviewStatusClassName,
  getApplicationReviewStatusLabel,
  getApplicationStatusClassName,
  getApplicationStatusLabel,
} from "@/shared/lib/recruitment";

interface AdminApplicantTableProps {
  applicants: AdminApplicantSummary[];
}

export function AdminApplicantTable({
  applicants,
}: AdminApplicantTableProps) {
  if (applicants.length === 0) {
    return (
      <div className="border-t border-outline-variant px-6 py-14 text-center">
        <p className="font-headline text-2xl font-semibold tracking-[-0.04em] text-on-surface">
          현재 조건에 맞는 지원자가 없습니다.
        </p>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">
          검색 조건을 조정하거나 일부 필터를 해제한 뒤 다시 확인해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface-container-low">
          <tr className="border-b border-outline-variant text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            <th className="px-6 py-4">지원자</th>
            <th className="px-6 py-4">공고</th>
            <th className="px-6 py-4">지원 상태</th>
            <th className="px-6 py-4">검토 상태</th>
            <th className="px-6 py-4">최근 활동</th>
            <th className="px-6 py-4 text-right">열기</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((applicant) => {
            const activityTimestamp =
              applicant.reviewedAt ?? applicant.submittedAt ?? applicant.draftSavedAt;

            return (
              <tr
                key={applicant.applicationId}
                className="border-b border-outline-variant/70 align-top transition-colors hover:bg-surface-container-low/50 last:border-b-0"
              >
                <td className="px-6 py-5">
                  <div className="space-y-1.5">
                    <p className="font-headline text-lg font-semibold tracking-[-0.04em] text-on-surface">
                      {applicant.applicantName}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {applicant.applicantEmail}
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
                      {applicant.applicantPhone}
                    </p>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <p className="font-medium text-on-surface">
                    {applicant.jobPostingTitle}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    지원서 #{applicant.applicationId}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex min-w-[96px] items-center justify-center rounded-sm px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${getApplicationStatusClassName(applicant.applicationStatus)}`}
                  >
                    {getApplicationStatusLabel(applicant.applicationStatus)}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex min-w-[96px] items-center justify-center rounded-sm px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${getApplicationReviewStatusClassName(applicant.reviewStatus)}`}
                  >
                    {getApplicationReviewStatusLabel(applicant.reviewStatus)}
                  </span>
                </td>

                <td className="px-6 py-5 text-sm text-on-surface-variant">
                  <p>{formatDateTime(activityTimestamp)}</p>
                  <p className="mt-1 text-xs">
                    제출 시각: {formatDateTime(applicant.submittedAt)}
                  </p>
                </td>

                <td className="px-6 py-5 text-right">
                  <Link
                    href={`/admin/applicants/${applicant.applicationId}`}
                    className="inline-flex items-center justify-center rounded-sm border border-outline px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
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
  );
}
