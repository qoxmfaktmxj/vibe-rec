import Link from "next/link";

import type { AdminApplicantSummary } from "@/entities/admin/applicant-model";
import { formatDateTime } from "@/shared/lib/recruitment";

interface AdminApplicantTableProps {
  applicants: AdminApplicantSummary[];
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
    <section className="rounded-sm border border-outline-variant bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="border-b border-outline-variant bg-surface-container-low">
            <tr className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              <th className="px-6 py-4 font-medium">지원자</th>
              <th className="px-6 py-4 font-medium">공고</th>
              <th className="px-6 py-4 font-medium">상태</th>
              <th className="px-6 py-4 font-medium">검토</th>
              <th className="px-6 py-4 font-medium">갱신 시각</th>
              <th className="px-6 py-4 font-medium">열기</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant) => (
              <tr
                key={applicant.applicationId}
                className="border-b border-outline-variant last:border-b-0"
              >
                <td className="px-6 py-5">
                  <p className="font-headline text-base font-medium tracking-[-0.03em] text-on-surface">
                    {applicant.applicantName}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {applicant.applicantEmail}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                    {applicant.applicantPhone}
                  </p>
                </td>
                <td className="px-6 py-5 text-on-surface">
                  {applicant.jobPostingTitle}
                </td>
                <td className="px-6 py-5 font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                  {applicant.applicationStatus}
                </td>
                <td className="px-6 py-5 font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                  {applicant.reviewStatus}
                </td>
                <td className="px-6 py-5 text-on-surface-variant">
                  {formatDateTime(
                    applicant.submittedAt ?? applicant.draftSavedAt,
                  )}
                </td>
                <td className="px-6 py-5">
                  <Link
                    href={`/admin/applicants/${applicant.applicationId}`}
                    className="inline-flex rounded-sm border border-on-surface px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
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
