import Link from "next/link";

import type { AdminJobPosting } from "@/entities/admin/model";
import { getAdminJobPostings } from "@/shared/api/admin-job-postings";
import {
  formatRecruitmentPeriod,
  getJobPostingStatusClassName,
  getJobPostingStatusLabel,
  getRecruitmentCategoryLabel,
  getRecruitmentModeLabel,
  groupJobPostings,
} from "@/shared/lib/recruitment";

function AdminJobPostingSection({
  title,
  description,
  jobPostings,
  emptyMessage,
}: {
  title: string;
  description: string;
  jobPostings: AdminJobPosting[];
  emptyMessage: string;
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

      {jobPostings.length === 0 ? (
        <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-6 text-sm text-on-surface-variant">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-3">
          {jobPostings.map((jobPosting) => (
            <div
              key={jobPosting.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-sm border border-outline-variant bg-surface-container-low px-5 py-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-sm bg-background px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-on-surface">
                    {getRecruitmentCategoryLabel(jobPosting.recruitmentCategory)}
                  </span>
                  <span
                    className={`rounded-sm px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] ${
                      jobPosting.recruitmentMode === "ROLLING"
                        ? "bg-primary/10 text-primary"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {getRecruitmentModeLabel(jobPosting.recruitmentMode)}
                  </span>
                  <span
                    className={`rounded-sm px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] ${getJobPostingStatusClassName(
                      jobPosting.status,
                    )}`}
                  >
                    {getJobPostingStatusLabel(jobPosting.status)}
                  </span>
                  <span className="rounded-sm bg-background px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-on-surface-variant">
                    {jobPosting.published ? "공개" : "비공개"}
                  </span>
                </div>

                <p className="font-headline text-lg font-medium tracking-[-0.03em] text-on-surface">
                  {jobPosting.title}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {jobPosting.headline}
                </p>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                  {jobPosting.location} · {jobPosting.employmentType} ·{" "}
                  {formatRecruitmentPeriod(jobPosting)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/job-postings/${jobPosting.id}`}
                  className="rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground"
                >
                  공고 수정
                </Link>
                <Link
                  href={`/admin/job-postings/${jobPosting.id}/questions`}
                  className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
                >
                  질문 관리
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AdminPage() {
  let jobPostings: AdminJobPosting[] = [];
  let loadError: string | null = null;

  try {
    jobPostings = await getAdminJobPostings();
  } catch (error) {
    if (error instanceof Error) {
      loadError =
        error.message === "Not Found"
          ? "관리자 공고 목록 API를 찾지 못했습니다. 백엔드 서버를 최신 코드로 다시 시작해 주세요."
          : error.message;
    } else {
      loadError = "관리자 공고 목록을 불러오지 못했습니다.";
    }
  }

  const groupedJobPostings = groupJobPostings(jobPostings);
  const publishedCount = jobPostings.filter((jobPosting) => jobPosting.published)
    .length;
  const openCount = jobPostings.filter(
    (jobPosting) => jobPosting.status === "OPEN",
  ).length;

  return (
    <div className="space-y-8">
      <section className="rounded-sm border border-outline-variant bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              대시보드
            </p>
            <h1 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
              채용 공고 관리
            </h1>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              신입 채용, 경력 채용, 상시 채용을 분리해서 관리하고 초안과
              비공개 공고까지 한 화면에서 다시 수정할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/job-postings/new"
              className="rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground"
            >
              공고 등록
            </Link>
            <Link
              href="/admin/applicants"
              className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
            >
              지원자 보기
            </Link>
            <Link
              href="/"
              className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
            >
              공개 사이트
            </Link>
          </div>
        </div>

        {loadError ? (
          <div className="mt-6 rounded-sm border border-error/40 bg-error-container px-4 py-4 text-sm text-destructive">
            <p className="font-medium">관리자 공고 목록을 불러오지 못했습니다.</p>
            <p className="mt-2 leading-6">{loadError}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                전체 공고
              </p>
              <p className="mt-3 font-headline text-4xl font-light tracking-[-0.06em] text-on-surface">
                {jobPostings.length}
              </p>
            </div>

            <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                모집 중
              </p>
              <p className="mt-3 font-headline text-4xl font-light tracking-[-0.06em] text-primary">
                {openCount}
              </p>
            </div>

            <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                공개 공고
              </p>
              <p className="mt-3 font-headline text-4xl font-light tracking-[-0.06em] text-on-surface">
                {publishedCount}
              </p>
            </div>

            <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                상시 채용
              </p>
              <p className="mt-3 font-headline text-4xl font-light tracking-[-0.06em] text-on-surface">
                {groupedJobPostings.rolling.length}
              </p>
            </div>
          </div>
        )}
      </section>

      {loadError ? null : (
        <section className="rounded-sm border border-outline-variant bg-card p-8">
          <div className="space-y-10">
            <AdminJobPostingSection
              title="신입 채용"
              description="졸업 예정자와 초기 경력 지원자용 공고를 모아서 관리합니다."
              jobPostings={groupedJobPostings.newGrad}
              emptyMessage="등록된 신입 채용 공고가 없습니다."
            />
            <AdminJobPostingSection
              title="경력 채용"
              description="즉시 투입 가능한 경력 포지션을 이 섹션에서 관리합니다."
              jobPostings={groupedJobPostings.experienced}
              emptyMessage="등록된 경력 채용 공고가 없습니다."
            />
            <AdminJobPostingSection
              title="상시 채용"
              description="마감일 없이 지원을 받는 공고를 별도 섹션으로 분리했습니다."
              jobPostings={groupedJobPostings.rolling}
              emptyMessage="등록된 상시 채용 공고가 없습니다."
            />
          </div>
        </section>
      )}
    </div>
  );
}
