"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminJobPosting } from "@/entities/admin/model";
import { PaginationBar } from "@/features/shared/PaginationBar";
import {
  formatRecruitmentPeriod,
  getJobPostingStatusClassName,
  getJobPostingStatusLabel,
  getRecruitmentCategoryLabel,
  getRecruitmentModeLabel,
} from "@/shared/lib/recruitment";

interface PaginatedAdminJobPostingSectionProps {
  title: string;
  description: string;
  jobPostings: AdminJobPosting[];
  emptyMessage: string;
  canManage: boolean;
  pageSize?: number;
}

export function PaginatedAdminJobPostingSection({
  title,
  description,
  jobPostings,
  emptyMessage,
  canManage,
  pageSize = 9,
}: PaginatedAdminJobPostingSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(jobPostings.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleJobPostings = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return jobPostings.slice(startIndex, startIndex + pageSize);
  }, [jobPostings, pageSize, safePage]);
  const startIndex = jobPostings.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = jobPostings.length === 0 ? 0 : startIndex + visibleJobPostings.length - 1;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h2 className="font-headline text-2xl font-medium tracking-[-0.02em] text-on-surface">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {description}
          </p>
        </div>
        <span className="text-xs font-medium text-on-surface-variant">
          총 {jobPostings.length}건
        </span>
      </div>

      {visibleJobPostings.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-5 py-6 text-sm text-on-surface-variant">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-3">
          {visibleJobPostings.map((jobPosting) => (
            <div
              key={jobPosting.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-low px-5 py-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-background px-2.5 py-1 text-xs font-medium text-on-surface">
                    {getRecruitmentCategoryLabel(jobPosting.recruitmentCategory)}
                  </span>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      jobPosting.recruitmentMode === "ROLLING"
                        ? "bg-brand/10 text-brand"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {getRecruitmentModeLabel(jobPosting.recruitmentMode)}
                  </span>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getJobPostingStatusClassName(
                      jobPosting.status,
                    )}`}
                  >
                    {getJobPostingStatusLabel(jobPosting.status)}
                  </span>
                  <span className="rounded-md bg-background px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                    {jobPosting.published ? "공개" : "비공개"}
                  </span>
                </div>

                <p className="font-headline text-lg font-medium tracking-[-0.02em] text-on-surface">
                  {jobPosting.title}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {jobPosting.headline}
                </p>
                <p className="text-xs font-medium text-on-surface-variant">
                  {jobPosting.location} · {jobPosting.employmentType} · {formatRecruitmentPeriod(jobPosting)}
                </p>
              </div>

              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/job-postings/${jobPosting.id}`}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:shadow-md"
                  >
                    공고 수정
                  </Link>
                  <Link
                    href={`/admin/job-postings/${jobPosting.id}/questions`}
                    className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-brand hover:text-brand"
                  >
                    질문 관리
                  </Link>
                </div>
              ) : (
                <span className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-on-surface-variant">
                  조회 전용
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <PaginationBar
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        summary={
          jobPostings.length === 0
            ? ""
            : `${startIndex}-${endIndex} / ${jobPostings.length}건`
        }
      />
    </section>
  );
}
