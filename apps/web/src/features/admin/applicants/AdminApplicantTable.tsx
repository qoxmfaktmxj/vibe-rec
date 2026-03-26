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
        label: "?쒖텧 ?꾨즺",
        className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      };
    case "DRAFT":
      return {
        label: "?꾩떆 ???,
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
        label: "?좉퇋",
        className: "bg-primary-container text-primary ring-primary/10",
      };
    case "IN_REVIEW":
      return {
        label: "寃??以?,
        className: "bg-sky-50 text-sky-800 ring-sky-200",
      };
    case "PASSED":
      return {
        label: "?⑷꺽",
        className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      };
    case "REJECTED":
      return {
        label: "遺덊빀寃?,
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
      <div className="border-t border-outline-variant px-6 py-14 text-center">
        <p className="font-headline text-2xl font-semibold tracking-[-0.04em] text-on-surface">
          議곌굔??留욌뒗 吏?먯옄媛 ?놁뒿?덈떎
        </p>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">
          寃??踰붿쐞瑜?醫곹엳嫄곕굹 ?꾪꽣瑜??댁젣?????ㅼ떆 ?뺤씤?섏꽭??
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface-container-low">
          <tr className="border-b border-outline-variant text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            <th className="px-6 py-4">吏?먯옄</th>
            <th className="px-6 py-4">怨듦퀬</th>
            <th className="px-6 py-4">吏???곹깭</th>
            <th className="px-6 py-4">寃???곹깭</th>
            <th className="px-6 py-4">理쒓렐 ?쒕룞</th>
            <th className="px-6 py-4 text-right">?닿린</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((applicant) => {
            const applicationStatus = getApplicationStatusMeta(
              applicant.applicationStatus,
            );
            const reviewStatus = getReviewStatusMeta(applicant.reviewStatus);
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
                    吏?먯꽌 #{applicant.applicationId}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex min-w-[96px] items-center justify-center rounded-sm px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${applicationStatus.className}`}
                  >
                    {applicationStatus.label}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex min-w-[96px] items-center justify-center rounded-sm px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${reviewStatus.className}`}
                  >
                    {reviewStatus.label}
                  </span>
                </td>

                <td className="px-6 py-5 text-sm text-on-surface-variant">
                  <p>{formatDateTime(activityTimestamp)}</p>
                  <p className="mt-1 text-xs">
                    ?쒖텧: {formatDateTime(applicant.submittedAt)}
                  </p>
                </td>

                <td className="px-6 py-5 text-right">
                  <Link
                    href={`/admin/applicants/${applicant.applicationId}`}
                    className="inline-flex items-center justify-center rounded-sm border border-outline px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    ?곸꽭 蹂닿린
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

