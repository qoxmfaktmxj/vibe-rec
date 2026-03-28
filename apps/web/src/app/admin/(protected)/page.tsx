import Link from "next/link";

import type { AdminJobPosting } from "@/entities/admin/model";
import { PaginatedAdminJobPostingSection } from "@/features/admin/job-postings/PaginatedAdminJobPostingSection";
import { getAdminJobPostings } from "@/shared/api/admin-job-postings";
import { groupJobPostings } from "@/shared/lib/recruitment";

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
  const publishedCount = jobPostings.filter((jobPosting) => jobPosting.published).length;
  const openCount = jobPostings.filter((jobPosting) => jobPosting.status === "OPEN").length;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-outline-variant bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary">
              대시보드
            </p>
            <h1 className="mt-2 font-headline text-3xl font-semibold tracking-[-0.02em] text-on-surface">
              채용 공고 관리
            </h1>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              신입, 경력, 상시 채용 공고를 분리해 보고 공개 여부까지 한 화면에서 확인할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/job-postings/new"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              공고 등록
            </Link>
            <Link
              href="/admin/applicants"
              className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
            >
              지원자 보기
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
            >
              공개 사이트
            </Link>
          </div>
        </div>

        {loadError ? (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-error-container px-4 py-4 text-sm text-destructive">
            <p className="font-medium">관리자 공고 목록을 불러오지 못했습니다.</p>
            <p className="mt-2 leading-6">{loadError}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <StatCard label="전체 공고" value={jobPostings.length} />
            <StatCard label="모집 중" value={openCount} accent="text-primary" />
            <StatCard label="공개 공고" value={publishedCount} />
            <StatCard label="상시 채용" value={groupedJobPostings.rolling.length} />
          </div>
        )}
      </section>

      {loadError ? null : (
        <section className="rounded-xl border border-outline-variant bg-card p-8">
          <div className="space-y-10">
            <PaginatedAdminJobPostingSection
              title="신입 채용"
              description="졸업 예정자와 초기 경력 지원자를 위한 공고를 모아 관리합니다."
              jobPostings={groupedJobPostings.newGrad}
              emptyMessage="등록된 신입 채용 공고가 없습니다."
            />
            <PaginatedAdminJobPostingSection
              title="경력 채용"
              description="즉시 투입 가능한 경력 지원자를 위한 공고를 모아 관리합니다."
              jobPostings={groupedJobPostings.experienced}
              emptyMessage="등록된 경력 채용 공고가 없습니다."
            />
            <PaginatedAdminJobPostingSection
              title="상시 채용"
              description="마감 없이 지원을 받는 공고를 별도로 관리합니다."
              jobPostings={groupedJobPostings.rolling}
              emptyMessage="등록된 상시 채용 공고가 없습니다."
            />
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "text-on-surface",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="stat-card card-shadow rounded-xl border border-outline-variant bg-card px-5 py-5 transition-colors hover:bg-surface-container-low">
      <p className="text-xs font-medium text-on-surface-variant">
        {label}
      </p>
      <p className={`mt-2 font-headline text-4xl font-bold tracking-[-0.04em] ${accent}`}>
        {value}
      </p>
    </div>
  );
}
