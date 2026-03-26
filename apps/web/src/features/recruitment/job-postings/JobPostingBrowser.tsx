"use client";

import { useMemo, useState } from "react";

import type {
  JobPostingSummary,
  RecruitmentCategory,
} from "@/entities/recruitment/model";
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
}

type RegularCategoryFilter = "ALL" | RecruitmentCategory;

const categoryFilters: Array<{
  value: RegularCategoryFilter;
  label: string;
}> = [
  { value: "ALL", label: "전체" },
  { value: "NEW_GRAD", label: "신입 채용" },
  { value: "EXPERIENCED", label: "경력 채용" },
];

function JobPostingSection({
  title,
  description,
  jobPostings,
  emptyMessage,
  hideRecruitmentModeBadge = false,
}: {
  title: string;
  description: string;
  jobPostings: JobPostingSummary[];
  emptyMessage: string;
  hideRecruitmentModeBadge?: boolean;
}) {
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
          {jobPostings.length}건
        </span>
      </div>

      <JobPostingList
        jobPostings={jobPostings}
        emptyMessage={emptyMessage}
        hideRecruitmentModeBadge={hideRecruitmentModeBadge}
      />
    </section>
  );
}

export function JobPostingBrowser({
  jobPostings,
  emptyMessage = "현재 등록된 채용 공고가 없습니다.",
  searchable = false,
  searchPlaceholder = "직무명, 한 줄 소개, 근무지, 고용 형태로 검색",
}: JobPostingBrowserProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<RegularCategoryFilter>("ALL");

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

  const regularSections =
    searchable && categoryFilter !== "ALL"
      ? [
          {
            key: categoryFilter,
            title: getRecruitmentCategoryLabel(categoryFilter),
            description:
              categoryFilter === "NEW_GRAD"
                ? "졸업 예정자와 초기 경력 지원자를 위한 공고입니다."
                : "실무 경험을 바탕으로 바로 합류할 수 있는 포지션입니다.",
            jobPostings:
              categoryFilter === "NEW_GRAD"
                ? groupedJobPostings.newGrad
                : groupedJobPostings.experienced,
            emptyMessage:
              categoryFilter === "NEW_GRAD"
                ? "조건에 맞는 신입 채용 공고가 없습니다."
                : "조건에 맞는 경력 채용 공고가 없습니다.",
          },
        ]
      : [
          {
            key: "NEW_GRAD",
            title: "신입 채용",
            description:
              "졸업 예정자와 초기 경력 지원자를 위한 공고를 모아서 볼 수 있습니다.",
            jobPostings: groupedJobPostings.newGrad,
            emptyMessage: searchable
              ? "조건에 맞는 신입 채용 공고가 없습니다."
              : emptyMessage,
          },
          {
            key: "EXPERIENCED",
            title: "경력 채용",
            description:
              "즉시 투입 가능한 경력 포지션을 이 섹션에서 확인할 수 있습니다.",
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
            </div>

            <label className="block min-w-0 lg:w-[360px]">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant">
                공고 검색
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder={searchPlaceholder}
                className="w-full rounded-sm border border-outline-variant bg-background px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary"
              />
            </label>
          </div>
        </section>
      ) : null}

      <div className="space-y-10">
        {regularSections.map((section) => (
          <JobPostingSection
            key={section.key}
            title={section.title}
            description={section.description}
            jobPostings={section.jobPostings}
            emptyMessage={section.emptyMessage}
          />
        ))}

        <JobPostingSection
          title="상시 채용"
          description="마감일 없이 지원을 받는 공고를 별도 섹션으로 분리했습니다."
          jobPostings={groupedJobPostings.rolling}
          emptyMessage={rollingEmptyMessage}
          hideRecruitmentModeBadge
        />
      </div>
    </div>
  );
}
