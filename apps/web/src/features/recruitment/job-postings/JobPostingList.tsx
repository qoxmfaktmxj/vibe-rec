import Link from "next/link";

import type { JobPostingSummary } from "@/entities/recruitment/model";
import { formatDateRange } from "@/shared/lib/recruitment";

interface JobPostingListProps {
  jobPostings: JobPostingSummary[];
}

const postingTranslations: Record<
  string,
  {
    title: string;
    headline: string;
    employmentType: string;
    location: string;
  }
> = {
  "platform-backend-engineer": {
    title: "플랫폼 백엔드 엔지니어",
    headline: "PostgreSQL 중심 아키텍처로 차세대 채용 플랫폼을 구축합니다.",
    employmentType: "정규직",
    location: "서울",
  },
  "product-designer": {
    title: "프로덕트 디자이너",
    headline: "지원자와 채용 담당자를 위한 경험을 설계합니다.",
    employmentType: "계약직",
    location: "서울",
  },
};

export function JobPostingList({ jobPostings }: JobPostingListProps) {
  if (jobPostings.length === 0) {
    return (
      <section className="rounded-sm border border-outline-variant bg-card px-8 py-14 text-center text-sm text-on-surface-variant">
        현재 게시된 채용 공고가 없습니다.
      </section>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {jobPostings.map((jobPosting) => {
        const translated = postingTranslations[jobPosting.publicKey];
        return (
          <article
            key={jobPosting.id}
            className="flex h-full flex-col rounded-sm border border-outline-variant bg-card p-6"
          >
            <div className="space-y-3">
              <h3 className="font-headline text-lg font-medium tracking-[-0.03em] text-on-surface">
                {translated?.title ?? jobPosting.title}
              </h3>
              <p className="text-sm text-on-surface-variant">
                {translated?.headline ?? jobPosting.headline}
              </p>
            </div>
            <div className="mt-6 space-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              <p>{translated?.employmentType ?? jobPosting.employmentType}</p>
              <p>{translated?.location ?? jobPosting.location}</p>
              <p>{formatDateRange(jobPosting.opensAt, jobPosting.closesAt)}</p>
              <p>전형 {jobPosting.stepCount}단계</p>
            </div>
            <Link
              href={`/job-postings/${jobPosting.id}`}
              className="mt-8 inline-flex w-fit items-center justify-center rounded-sm border border-on-surface px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-on-surface transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              지원하기
            </Link>
          </article>
        );
      })}
    </div>
  );
}
