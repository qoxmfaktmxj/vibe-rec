import Link from "next/link";

import type { JobPostingSummary } from "@/entities/recruitment/model";
import {
  formatRecruitmentPeriod,
  getEmploymentTypeLabel,
  getJobPostingDdayInfo,
  getRecruitmentCategoryLabel,
} from "@/shared/lib/recruitment";

interface HomeJobPostingPreviewProps {
  jobPostings: JobPostingSummary[];
}

function getDeadlineLabel(jobPosting: JobPostingSummary) {
  const ddayInfo = getJobPostingDdayInfo(jobPosting);

  if (ddayInfo.kind === "rolling") {
    return "상시 채용";
  }

  if (ddayInfo.kind === "closed") {
    return "모집 마감";
  }

  return ddayInfo.label;
}

export function HomeJobPostingPreview({ jobPostings }: HomeJobPostingPreviewProps) {
  const previewJobPostings = jobPostings.slice(0, 5);

  if (previewJobPostings.length === 0) {
    return (
      <div className="border-y border-outline-variant py-14 text-center">
        <p className="font-headline text-xl font-semibold text-on-surface">
          현재 모집 중인 포지션이 없습니다
        </p>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">
          새로운 채용 공고가 열리면 이 페이지에서 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <ol className="border-y border-outline-variant">
      {previewJobPostings.map((jobPosting, index) => (
        <li key={jobPosting.id} className="job-index-row border-b border-outline-variant last:border-b-0">
          <Link
            href={`/job-postings/${jobPosting.id}`}
            className="group grid min-h-36 gap-5 px-1 py-6 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 md:grid-cols-[3rem_minmax(0,1.35fr)_minmax(14rem,0.65fr)_3rem] md:items-center md:px-5"
            aria-label={`${jobPosting.title} 공고 보기`}
          >
            <span className="font-mono text-xs tabular-nums text-on-surface-variant">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
                <span className="text-brand">
                  {getRecruitmentCategoryLabel(jobPosting.recruitmentCategory)}
                </span>
                <span className="text-on-surface-variant">{getDeadlineLabel(jobPosting)}</span>
              </div>
              <h3 className="font-headline text-[clamp(1.4rem,2.2vw,2rem)] font-semibold leading-tight tracking-[-0.02em] text-on-surface transition-transform duration-300 ease-out group-hover:translate-x-2 group-focus-visible:translate-x-2">
                {jobPosting.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                {jobPosting.headline}
              </p>
            </div>

            <div className="space-y-2 text-sm text-on-surface-variant">
              <p>{getEmploymentTypeLabel(jobPosting.employmentType)}</p>
              <p>{jobPosting.location}</p>
              <p className="font-mono text-xs tabular-nums">
                {formatRecruitmentPeriod(jobPosting)}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em]">
                {(jobPosting.steps ?? []).length}단계 전형
              </p>
            </div>

            <span className="job-index-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
