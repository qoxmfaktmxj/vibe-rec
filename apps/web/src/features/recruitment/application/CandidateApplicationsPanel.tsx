"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { CandidateApplicationSummary } from "@/entities/recruitment/model";
import { PaginationBar } from "@/features/shared/PaginationBar";
import {
  formatDateTime,
  getApplicationReviewStatusClassName,
  getApplicationReviewStatusLabel,
  getApplicationStatusClassName,
  getApplicationStatusLabel,
  getEmploymentTypeLabel,
  getFinalStatusLabel,
} from "@/shared/lib/recruitment";

interface CandidateApplicationsPanelProps {
  applications: CandidateApplicationSummary[];
  variant?: "detailed" | "compact";
  pageSize?: number;
}

function buildSummary(totalItems: number, currentPage: number, pageSize: number) {
  if (totalItems === 0) {
    return "현재 지원 내역이 없습니다.";
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, start + pageSize - 1);
  return `${start}-${end} / ${totalItems}건`;
}

export function CandidateApplicationsPanel({
  applications,
  variant = "detailed",
  pageSize = 30,
}: CandidateApplicationsPanelProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(applications.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleApplications = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return applications.slice(startIndex, startIndex + pageSize);
  }, [applications, pageSize, safePage]);
  const summary = buildSummary(applications.length, safePage, pageSize);

  if (applications.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-on-surface-variant">아직 지원한 내역이 없습니다.</p>
        <Link
          href="/job-postings"
          className="mt-4 inline-flex rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
        >
          채용 공고 보기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {variant === "detailed" ? (
        <div className="grid gap-4">
          {visibleApplications.map((application) => (
            <article
              key={application.applicationId}
              className="rounded-sm border border-outline-variant bg-card p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-headline text-2xl font-medium tracking-[-0.03em] text-on-surface">
                    {application.jobPostingTitle}
                  </h3>
                  <p className="text-sm leading-7 text-on-surface-variant">
                    {application.jobPostingHeadline}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                    {application.location} · {getEmploymentTypeLabel(application.employmentType)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getApplicationStatusClassName(
                      application.status,
                    )}`}
                  >
                    {getApplicationStatusLabel(application.status)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getApplicationReviewStatusClassName(
                      application.reviewStatus,
                    )}`}
                  >
                    {getApplicationReviewStatusLabel(application.reviewStatus)}
                  </span>
                  {application.finalStatus ? (
                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-medium text-on-surface">
                      최종 결과: {getFinalStatusLabel(application.finalStatus)}
                    </span>
                  ) : null}
                </div>
              </div>

              <dl className="mt-5 grid gap-3 text-sm text-on-surface-variant md:grid-cols-2">
                <div>
                  <dt>임시 저장 시각</dt>
                  <dd className="mt-1 font-medium text-on-surface">
                    {formatDateTime(application.draftSavedAt)}
                  </dd>
                </div>
                <div>
                  <dt>제출 일시</dt>
                  <dd className="mt-1 font-medium text-on-surface">
                    {formatDateTime(application.submittedAt)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/job-postings/${application.jobPostingId}`}
                  className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
                >
                  {application.status === "DRAFT"
                    ? "이어서 작성"
                    : "공고에서 진행 상태 보기"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleApplications.map((application) => (
            <div
              key={application.applicationId}
              className="flex items-center justify-between gap-4 rounded-sm border border-outline-variant bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-on-surface">
                  {application.jobPostingTitle}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-outline">
                  <span>{getEmploymentTypeLabel(application.employmentType)}</span>
                  <span>{application.location}</span>
                  <span>
                    {application.submittedAt
                      ? `제출: ${new Date(application.submittedAt).toLocaleDateString("ko-KR")}`
                      : `임시 저장: ${new Date(application.draftSavedAt).toLocaleDateString("ko-KR")}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-medium ${getApplicationReviewStatusClassName(
                    application.reviewStatus,
                  )}`}
                >
                  {application.status === "DRAFT"
                    ? "임시 저장"
                    : getApplicationReviewStatusLabel(application.reviewStatus)}
                </span>
                <Link
                  href={
                    application.status === "DRAFT"
                      ? `/job-postings/${application.jobPostingId}/apply`
                      : `/job-postings/${application.jobPostingId}`
                  }
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {application.status === "DRAFT" ? "이어서 작성" : "상세 보기"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaginationBar
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        summary={summary}
      />
    </div>
  );
}
