"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { CandidateApplicationSummary } from "@/entities/recruitment/model";
import { PaginationBar } from "@/features/shared/PaginationBar";
import { RecruitmentStepper } from "@/features/shared/RecruitmentStepper";
import {
  formatDateTime,
  getApplicationFlowProgress,
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
          className="mt-4 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
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
          {visibleApplications.map((application) => {
            const flowProgress = getApplicationFlowProgress(application);
            const stepperSteps = flowProgress.labels.map((label) => ({ label }));
            const primaryAction =
              application.status === "DRAFT"
                ? {
                    href: `/job-postings/${application.jobPostingId}/apply`,
                    label: "이어서 작성",
                    variant: "filled" as const,
                  }
                : {
                    href: `/me/applications/${application.applicationId}`,
                    label: "지원서 보기",
                    variant: "outline" as const,
                  };

            return (
              <article
                key={application.applicationId}
                className="rounded-xl border border-outline-variant bg-card p-6 elevation-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <h3 className="font-headline text-xl font-semibold tracking-[-0.01em] text-on-surface">
                      {application.jobPostingTitle}
                    </h3>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
                      {application.location} · {getEmploymentTypeLabel(application.employmentType)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${getApplicationStatusClassName(
                        application.status,
                      )}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {getApplicationStatusLabel(application.status)}
                    </span>
                    {primaryAction.variant === "filled" ? (
                      <Link
                        href={primaryAction.href}
                        className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                      >
                        {primaryAction.label}
                      </Link>
                    ) : (
                      <Link
                        href={primaryAction.href}
                        className="inline-flex min-h-[44px] items-center rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-brand hover:text-brand"
                      >
                        {primaryAction.label}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  {flowProgress.isRejected ? (
                    <div className="rounded-lg bg-rose-50 px-4 py-3 ring-1 ring-inset ring-rose-200">
                      <p className="text-sm font-medium text-rose-900">
                        아쉽게도 이번 채용에서는 함께하지 못하게 되었습니다.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-rose-800">
                        관심을 가지고 지원해 주셔서 감사합니다. 다른 공고에서 다시 만나뵙기를 기대합니다.
                      </p>
                    </div>
                  ) : (
                    <RecruitmentStepper
                      steps={stepperSteps}
                      currentIndex={flowProgress.currentIndex}
                    />
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
                  <dl className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] tabular-nums text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <dt>임시 저장</dt>
                      <dd className="text-on-surface">
                        {formatDateTime(application.draftSavedAt)}
                      </dd>
                    </div>
                    {application.submittedAt ? (
                      <div className="flex items-center gap-1.5">
                        <dt>제출</dt>
                        <dd className="text-on-surface">
                          {formatDateTime(application.submittedAt)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <Link
                    href={`/job-postings/${application.jobPostingId}`}
                    className="text-xs font-medium text-brand transition-colors hover:text-brand-strong hover:underline"
                  >
                    원문 공고 보기
                  </Link>
                </div>

                {application.finalStatus && !flowProgress.isRejected ? (
                  <p className="mt-3 text-xs text-on-surface-variant">
                    최종 결과: {getFinalStatusLabel(application.finalStatus)}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleApplications.map((application) => (
            <div
              key={application.applicationId}
              className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-on-surface">
                  {application.jobPostingTitle}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] tabular-nums text-on-surface-variant">
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
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ring-1 ring-inset ${getApplicationReviewStatusClassName(
                    application.reviewStatus,
                  )}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                  {application.status === "DRAFT"
                    ? "임시 저장"
                    : getApplicationReviewStatusLabel(application.reviewStatus)}
                </span>
                <Link
                  href={
                    application.status === "DRAFT"
                      ? `/job-postings/${application.jobPostingId}/apply`
                      : `/me/applications/${application.applicationId}`
                  }
                  className="text-xs font-medium text-brand transition-colors hover:text-brand-strong hover:underline"
                >
                  {application.status === "DRAFT" ? "이어서 작성" : "지원서 보기"}
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
