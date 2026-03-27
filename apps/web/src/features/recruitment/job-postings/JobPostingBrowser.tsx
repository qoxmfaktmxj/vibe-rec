"use client";

import { useMemo, useState } from "react";

import type {
  JobPostingSummary,
  RecruitmentCategory,
} from "@/entities/recruitment/model";
import { PaginationBar } from "@/features/shared/PaginationBar";
import {
  getRecruitmentCategoryLabel,
  getRecruitmentModeLabel,
  groupJobPostings,
} from "@/shared/lib/recruitment";

import { JobPostingList } from "./JobPostingList";

interface JobPostingBrowserProps {
  jobPostings: JobPostingSummary[];
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
}

type CategoryFilter = "ALL" | RecruitmentCategory | "ROLLING";

type JobPostingSectionConfig = {
  key: CategoryFilter;
  title: string;
  description: string;
  jobPostings: JobPostingSummary[];
  emptyMessage: string;
  hideRecruitmentModeBadge?: boolean;
};

const categoryFilters: Array<{
  value: CategoryFilter;
  label: string;
}> = [
  { value: "ALL", label: "전체" },
  { value: "NEW_GRAD", label: "신입 채용" },
  { value: "EXPERIENCED", label: "경력 채용" },
  { value: "ROLLING", label: "상시 채용" },
];

function paginateItems<T>(items: T[], currentPage: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    currentPage: safePage,
    totalPages,
    startIndex,
  };
}

function JobPostingSection({
  title,
  description,
  jobPostings,
  emptyMessage,
  hideRecruitmentModeBadge = false,
  pageSize,
}: {
  title: string;
  description: string;
  jobPostings: JobPostingSummary[];
  emptyMessage: string;
  hideRecruitmentModeBadge?: boolean;
  pageSize: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const paged = paginateItems(jobPostings, currentPage, pageSize);
  const summary =
    jobPostings.length === 0
      ? ""
      : `${paged.startIndex + 1}-${paged.startIndex + paged.items.length} / ${jobPostings.length}건`;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {description}
          </p>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
          총 {jobPostings.length}건
        </span>
      </div>

      <JobPostingList
        jobPostings={paged.items}
        emptyMessage={emptyMessage}
        hideRecruitmentModeBadge={hideRecruitmentModeBadge}
      />

      <PaginationBar
        currentPage={paged.currentPage}
        totalPages={paged.totalPages}
        onPageChange={setCurrentPage}
        summary={summary}
      />
    </section>
  );
}

export function JobPostingBrowser({
  jobPostings,
  emptyMessage = "현재 등록된 채용 공고가 없습니다.",
  searchable = false,
  searchPlaceholder = "공고명, 소개, 근무지, 채용 형태로 검색",
  pageSize = 9,
}: JobPostingBrowserProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");

  const trimmedQuery = query.trim().toLowerCase();
  const filteredJobPostings = useMemo(() => {
    if (!trimmedQuery) {
      return jobPostings;
    }

    return jobPostings.filter((jobPosting) => {
      const target = [
        jobPosting.title,
        jobPosting.headline,
        jobPosting.location,
        jobPosting.employmentType,
        getRecruitmentCategoryLabel(jobPosting.recruitmentCategory),
        getRecruitmentModeLabel(jobPosting.recruitmentMode),
      ]
        .join(" ")
        .toLowerCase();

      return target.includes(trimmedQuery);
    });
  }, [jobPostings, trimmedQuery]);

  const groupedJobPostings = useMemo(
    () => groupJobPostings(filteredJobPostings),
    [filteredJobPostings],
  );
  const activeFilterDescription =
    categoryFilter === "ALL"
      ? "전체 공고를 신입, 경력, 상시 채용 섹션으로 나눠 한 번에 볼 수 있습니다."
      : categoryFilter === "NEW_GRAD"
        ? "신입 지원자와 초기 경력 지원자를 위한 공고만 모아 보여줍니다."
        : categoryFilter === "EXPERIENCED"
          ? "실무 경험을 가진 지원자를 위한 공고만 따로 확인할 수 있습니다."
          : "마감 없이 상시로 열려 있는 공고만 따로 모아 보여줍니다.";

  const regularSections: JobPostingSectionConfig[] =
    searchable && categoryFilter !== "ALL"
      ? [
          {
            key: categoryFilter,
            title:
              categoryFilter === "ROLLING"
                ? "상시 채용"
                : getRecruitmentCategoryLabel(categoryFilter),
            description:
              categoryFilter === "NEW_GRAD"
                ? "신입 지원자와 초기 경력 지원자를 위한 공고를 모아 보여줍니다."
                : categoryFilter === "EXPERIENCED"
                  ? "경력 보유 지원자를 위한 공고를 모아 보여줍니다."
                  : "일정 제한 없이 지원 가능한 공고를 따로 모아 보여줍니다.",
            jobPostings:
              categoryFilter === "NEW_GRAD"
                ? groupedJobPostings.newGrad
                : categoryFilter === "EXPERIENCED"
                  ? groupedJobPostings.experienced
                  : groupedJobPostings.rolling,
            emptyMessage:
              categoryFilter === "NEW_GRAD"
                ? "조건에 맞는 신입 채용 공고가 없습니다."
                : categoryFilter === "EXPERIENCED"
                  ? "조건에 맞는 경력 채용 공고가 없습니다."
                  : "조건에 맞는 상시 채용 공고가 없습니다.",
            hideRecruitmentModeBadge: categoryFilter === "ROLLING",
          },
        ]
      : [
          {
            key: "NEW_GRAD" as const,
            title: "신입 채용",
            description:
              "신입 지원자와 초기 경력 지원자를 위한 공고를 모아 보여줍니다.",
            jobPostings: groupedJobPostings.newGrad,
            emptyMessage: searchable
              ? "조건에 맞는 신입 채용 공고가 없습니다."
              : emptyMessage,
          },
          {
            key: "EXPERIENCED" as const,
            title: "경력 채용",
            description: "경력 보유 지원자를 위한 공고를 모아 보여줍니다.",
            jobPostings: groupedJobPostings.experienced,
            emptyMessage: searchable
              ? "조건에 맞는 경력 채용 공고가 없습니다."
              : emptyMessage,
          },
        ];

  const rollingEmptyMessage =
    searchable && trimmedQuery
      ? "조건에 맞는 상시 채용 공고가 없습니다."
      : "현재 상시 채용 공고가 없습니다.";

  const sectionResetKey = `${categoryFilter}:${trimmedQuery}`;

  return (
    <div className="space-y-10">
      {searchable ? (
        <section className="rounded-sm border border-outline-variant bg-card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                채용 검색
              </p>
              <div className="flex flex-wrap gap-2">
                {categoryFilters.map((filter) => {
                  const isActive = categoryFilter === filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setCategoryFilter(filter.value)}
                      className={`rounded-sm border px-4 py-2 text-xs font-medium tracking-[0.08em] transition-colors ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-outline-variant bg-background text-on-surface"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm leading-6 text-on-surface-variant">
                {activeFilterDescription}
              </p>
            </div>

            <label className="block min-w-0 lg:w-[360px]">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                키워드 검색
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder={searchPlaceholder}
                className="w-full rounded-sm border border-outline-variant bg-background px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
        </section>
      ) : null}

      <div className="space-y-10">
        {regularSections.map((section) => (
          <JobPostingSection
            key={`${section.key}:${sectionResetKey}`}
            title={section.title}
            description={section.description}
            jobPostings={section.jobPostings}
            emptyMessage={section.emptyMessage}
            hideRecruitmentModeBadge={section.hideRecruitmentModeBadge}
            pageSize={pageSize}
          />
        ))}

        {categoryFilter === "ALL" ? (
          <JobPostingSection
            key={`ROLLING:${sectionResetKey}`}
            title="상시 채용"
            description="일정 제한 없이 지원 가능한 공고를 따로 모아 보여줍니다."
            jobPostings={groupedJobPostings.rolling}
            emptyMessage={rollingEmptyMessage}
            hideRecruitmentModeBadge
            pageSize={pageSize}
          />
        ) : null}
      </div>
    </div>
  );
}
