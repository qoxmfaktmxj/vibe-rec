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
      <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white/80 p-10 text-center text-sm text-stone-600">
        조회 조건에 맞는 지원자가 없습니다.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-black/8 bg-white/84 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-stone-950 text-stone-100">
            <tr>
              <th className="px-5 py-4 font-medium">지원자</th>
              <th className="px-5 py-4 font-medium">공고</th>
              <th className="px-5 py-4 font-medium">지원 상태</th>
              <th className="px-5 py-4 font-medium">검토 상태</th>
              <th className="px-5 py-4 font-medium">제출 시각</th>
              <th className="px-5 py-4 font-medium">상세</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant) => (
              <tr
                key={applicant.applicationId}
                className="border-t border-stone-200 bg-white align-top"
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-stone-950">
                    {applicant.applicantName}
                  </p>
                  <p className="mt-1 text-stone-600">{applicant.applicantEmail}</p>
                  <p className="text-stone-500">{applicant.applicantPhone}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-stone-900">
                    {applicant.jobPostingTitle}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getApplicationStatusClassName(applicant.applicationStatus)}`}
                  >
                    {getApplicationStatusLabel(applicant.applicationStatus)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getApplicationReviewStatusClassName(applicant.reviewStatus)}`}
                  >
                    {getApplicationReviewStatusLabel(applicant.reviewStatus)}
                  </span>
                </td>
                <td className="px-5 py-4 text-stone-600">
                  {formatDateTime(applicant.submittedAt ?? applicant.draftSavedAt)}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/applicants/${applicant.applicationId}`}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
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
