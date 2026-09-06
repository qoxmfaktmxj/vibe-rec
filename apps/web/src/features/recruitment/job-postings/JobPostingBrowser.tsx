"use client";

import { useMemo, useState } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

import type {
  JobPostingSummary,
  RecruitmentCategory,
} from "@/entities/recruitment/model";
import { PaginationBar } from "@/features/shared/PaginationBar";
import {
  getRecruitmentCategoryLabel,
  getRecruitmentModeLabel,
  groupJobPostings,
  isJobPostingOpenForApplications,
} from "@/shared/lib/recruitment";

import { JobPostingList } from "./JobPostingList";

interface JobPostingBrowserProps {
  jobPostings: JobPostingSummary[];
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  showAvailabilityFilter?: boolean;
  defaultAvailabilityFilter?: AvailabilityFilter;
}

type CategoryFilter = "ALL" | RecruitmentCategory | "ROLLING";
type AvailabilityFilter = "OPEN" | "ALL";

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

const availabilityFilters: Array<{
  value: AvailabilityFilter;
  label: string;
}> = [
  { value: "OPEN", label: "모집 중" },
  { value: "ALL", label: "전체" },
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
    <section className="job-index-section">
      <div className="grid gap-5 border-t-2 border-on-surface py-6 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)_auto] md:items-start">
        <div className="flex items-baseline gap-4">
          <h2 className="font-headline text-3xl font-semibold tracking-[-0.025em] text-on-surface">
            {title}
          </h2>
          <span className="font-mono text-xs tabular-nums text-brand">
            {String(jobPostings.length).padStart(2, "0")}
          </span>
        </div>
        <p className="max-w-sm text-sm leading-7 text-on-surface-variant">
          {description}
        </p>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
          OPEN ROLES
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
  searchPlaceholder = "공고명, 소개, 근무지, 고용 형태로 검색",
  pageSize = 9,
  showAvailabilityFilter = false,
  defaultAvailabilityFilter = "ALL",
}: JobPostingBrowserProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>(defaultAvailabilityFilter);

  const trimmedQuery = query.trim().toLowerCase();
  const availabilityFilteredJobPostings = useMemo(() => {
    if (availabilityFilter === "ALL") {
      return jobPostings;
    }

    return jobPostings.filter(isJobPostingOpenForApplications);
  }, [availabilityFilter, jobPostings]);

  const filteredJobPostings = useMemo(() => {
    if (!trimmedQuery) {
      return availabilityFilteredJobPostings;
    }

    return availabilityFilteredJobPostings.filter((jobPosting) => {
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
  }, [availabilityFilteredJobPostings, trimmedQuery]);

  const groupedJobPostings = useMemo(
    () => groupJobPostings(filteredJobPostings),
    [filteredJobPostings],
  );
  const filterCounts = useMemo(
    () => ({
      ALL: filteredJobPostings.length,
      NEW_GRAD: groupedJobPostings.newGrad.length,
      EXPERIENCED: groupedJobPostings.experienced.length,
      ROLLING: groupedJobPostings.rolling.length,
    }),
    [filteredJobPostings.length, groupedJobPostings],
  );
  const activeFilterDescription =
    categoryFilter === "ALL"
      ? availabilityFilter === "OPEN"
        ? "지금 바로 지원 가능한 공고만 모아 보여줍니다."
        : "전체 공고를 신입, 경력, 상시 채용 섹션으로 나눠 한 번에 보여줍니다."
      : categoryFilter === "NEW_GRAD"
        ? "신입 지원자와 초기 경력 지원자를 위한 공고만 모아 보여줍니다."
        : categoryFilter === "EXPERIENCED"
          ? "실무 경험이 있는 지원자를 위한 공고만 따로 확인할 수 있습니다."
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
                ? "신입 지원자와 초기 경력 지원자를 위한 공고만 모아 보여줍니다."
                : categoryFilter === "EXPERIENCED"
                  ? "경력 보유 지원자를 위한 공고만 모아 보여줍니다."
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
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="space-y-16">
        {searchable ? (
          <section className="job-filter-shell border-y border-outline-variant py-6">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  원하는 역할 좁혀보기
                </h2>
              {showAvailabilityFilter ? (
                <div
                  role="group"
                  aria-label="지원 가능 여부 필터"
                  className="flex flex-wrap gap-2"
                >
                  {availabilityFilters.map((filter) => {
                    const isActive = availabilityFilter === filter.value;

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setAvailabilityFilter(filter.value)}
                        aria-pressed={isActive}
                        className={`min-h-11 rounded-full border px-4 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-outline-variant bg-card text-on-surface hover:border-brand/40 hover:text-brand"
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <div role="group" aria-label="채용 카테고리 필터" className="flex flex-wrap gap-2">
                {categoryFilters.map((filter) => {
                  const isActive = categoryFilter === filter.value;
                  const filterCount = filterCounts[filter.value];

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setCategoryFilter(filter.value)}
                      aria-pressed={isActive}
                      aria-describedby="job-posting-filter-description"
                      className={`min-h-11 rounded-full border px-4 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-outline-variant bg-card text-on-surface hover:border-brand/40 hover:text-brand"
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span className="ml-2 text-xs opacity-70">
                        {filterCount}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p
                id="job-posting-filter-description"
                className="text-sm leading-6 text-on-surface-variant"
              >
                {activeFilterDescription}
              </p>
            </div>

              <label className="block min-w-0 lg:w-[380px]">
              <span className="mb-2 block text-xs font-medium text-on-surface-variant">
                키워드 검색
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder={searchPlaceholder}
                  className="w-full rounded-full border border-outline-variant bg-card px-5 py-3.5 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-brand focus:ring-2 focus:ring-ring/25"
              />
            </label>
          </div>
        </section>
      ) : null}

        <div className="space-y-16">
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
      </MotionConfig>
    </LazyMotion>
  );
}
