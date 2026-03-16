import Link from "next/link";

import type { AdminApplicantSummary } from "@/entities/admin/applicant-model";
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
      <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-10 text-center text-sm text-on-surface-variant">
        조회 조건에 맞는 지원자가 없습니다.
      </section>
    );
  }

  return (
    <section className="ambient-shadow overflow-hidden rounded-xl bg-surface-container-lowest">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-6 py-4 font-semibold text-on-surface-variant">
                지원자
              </th>
              <th className="px-6 py-4 font-semibold text-on-surface-variant">
                공고
              </th>
              <th className="px-6 py-4 font-semibold text-on-surface-variant">
                지원 상태
              </th>
              <th className="px-6 py-4 font-semibold text-on-surface-variant">
                검토 상태
              </th>
              <th className="px-6 py-4 font-semibold text-on-surface-variant">
                제출 시각
              </th>
              <th className="px-6 py-4 font-semibold text-on-surface-variant">
                상세
              </th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant, index) => (
              <tr
                key={applicant.applicationId}
                className={`align-top ${
                  index % 2 === 0
                    ? "bg-surface-container-lowest"
                    : "bg-surface-container-low/50"
                }`}
              >
                <td className="px-6 py-4">
                  <p className="font-semibold text-on-surface">
                    {applicant.applicantName}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {applicant.applicantEmail}
                  </p>
                  <p className="text-xs text-outline">
                    {applicant.applicantPhone}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-on-surface">
                    {applicant.jobPostingTitle}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getApplicationStatusClassName(applicant.applicationStatus)}`}
                  >
                    {getApplicationStatusLabel(applicant.applicationStatus)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getApplicationReviewStatusClassName(applicant.reviewStatus)}`}
                  >
                    {getApplicationReviewStatusLabel(applicant.reviewStatus)}
                  </span>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">
                  {formatDateTime(
                    applicant.submittedAt ?? applicant.draftSavedAt,
                  )}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/applicants/${applicant.applicationId}`}
                    className="rounded-lg bg-gradient-primary px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    보기
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
