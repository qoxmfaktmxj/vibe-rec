"use client";

import Link from "next/link";
import type { CandidateApplicationSummary } from "@/entities/recruitment/model";

interface ProfileApplicationHistoryProps {
  applications: CandidateApplicationSummary[];
}

function getStatusBadge(status: string, reviewStatus: string) {
  if (status === "DRAFT") {
    return { label: "임시저장", className: "bg-stone-200 text-stone-700" };
  }
  switch (reviewStatus) {
    case "PASSED": return { label: "합격", className: "bg-green-100 text-green-800" };
    case "REJECTED": return { label: "불합격", className: "bg-red-100 text-red-800" };
    case "IN_REVIEW": return { label: "검토 중", className: "bg-yellow-100 text-yellow-800" };
    default: return { label: "접수 완료", className: "bg-blue-100 text-blue-800" };
  }
}

export function ProfileApplicationHistory({ applications }: ProfileApplicationHistoryProps) {
  if (applications.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-on-surface-variant">아직 지원한 공고가 없습니다.</p>
        <Link
          href="/job-postings"
          className="mt-4 inline-flex rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
        >
          공고 보러가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const badge = getStatusBadge(app.status, app.reviewStatus);
        return (
          <div
            key={app.applicationId}
            className="flex items-center justify-between gap-4 rounded-sm border border-outline-variant bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-on-surface">
                {app.jobPostingTitle}
              </h3>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-outline">
                <span>{app.employmentType}</span>
                <span>{app.location}</span>
                <span>
                  {app.submittedAt
                    ? `제출: ${new Date(app.submittedAt).toLocaleDateString("ko-KR")}`
                    : `임시저장: ${new Date(app.draftSavedAt).toLocaleDateString("ko-KR")}`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[10px] font-medium ${badge.className}`}>
                {badge.label}
              </span>
              <Link
                href={
                  app.status === "DRAFT"
                    ? `/job-postings/${app.jobPostingId}/apply`
                    : `/job-postings/${app.jobPostingId}`
                }
                className="text-xs font-medium text-primary hover:underline"
              >
                {app.status === "DRAFT" ? "이어서 작성" : "상세 보기"}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
