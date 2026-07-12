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
  const draftCount = jobPostings.filter((jobPosting) => jobPosting.status === "DRAFT").length;
  const closedCount = jobPostings.filter((jobPosting) => jobPosting.status === "CLOSED").length;
  const total = jobPostings.length;

  const statusDistribution = [
    { label: "모집 중", count: openCount, token: "var(--chart-1)" },
    { label: "임시 저장", count: draftCount, token: "var(--chart-2)" },
    { label: "마감", count: closedCount, token: "var(--chart-4)" },
  ].filter((segment) => segment.count > 0);

  const categoryDistribution = [
    { label: "신입 채용", count: groupedJobPostings.newGrad.length, token: "var(--chart-1)" },
    { label: "경력 채용", count: groupedJobPostings.experienced.length, token: "var(--chart-2)" },
    { label: "상시 채용", count: groupedJobPostings.rolling.length, token: "var(--chart-3)" },
  ].filter((segment) => segment.count > 0);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-outline-variant bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
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
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              공고 등록
            </Link>
            <Link
              href="/admin/applicants"
              className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-brand hover:text-brand"
            >
              지원자 보기
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-brand hover:text-brand"
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
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <StatCard label="전체 공고" value={jobPostings.length} />
              <StatCard label="모집 중" value={openCount} accent="text-brand" />
              <StatCard label="공개 공고" value={publishedCount} />
              <StatCard label="상시 채용" value={groupedJobPostings.rolling.length} />
            </div>

            {total > 0 ? (
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <DistributionBar
                  title="공고 상태 분포"
                  segments={statusDistribution}
                  total={total}
                />
                <DistributionBar
                  title="채용 유형 분포"
                  segments={categoryDistribution}
                  total={total}
                />
              </div>
            ) : null}
          </>
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
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-card px-5 py-5 elevation-1 transition-colors hover:bg-surface-container-low">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-on-surface-variant">
        {label}
      </p>
      <p className={`mt-2 font-headline tabular-nums text-3xl font-bold tracking-[-0.02em] ${accent}`}>
        {value}
      </p>
    </div>
  );
}

interface DistributionSegment {
  label: string;
  count: number;
  token: string;
}

function DistributionBar({
  title,
  segments,
  total,
}: {
  title: string;
  segments: DistributionSegment[];
  total: number;
}) {
  const summaryLabel = segments
    .map((segment) => `${segment.label} ${segment.count}건`)
    .join(", ");

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
        {title}
      </p>

      <div
        role="img"
        aria-label={`${title}: 전체 ${total}건 중 ${summaryLabel}`}
        className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-container"
      >
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(segment.count / total) * 100}%`,
              backgroundColor: segment.token,
            }}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: segment.token }}
            />
            <span className="text-on-surface-variant">{segment.label}</span>
            <span className="font-mono tabular-nums text-on-surface">
              {segment.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
