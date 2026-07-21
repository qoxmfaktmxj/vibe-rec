import Link from "next/link";

import type { AdminDashboard } from "@/entities/admin/dashboard-model";
import type { AdminJobPosting } from "@/entities/admin/model";
import { PaginatedAdminJobPostingSection } from "@/features/admin/job-postings/PaginatedAdminJobPostingSection";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { getAdminDashboard } from "@/shared/api/admin-dashboard";
import { getAdminJobPostings } from "@/shared/api/admin-job-postings";
import { groupJobPostings } from "@/shared/lib/recruitment";

export default async function AdminPage() {
  const adminSession = await getCurrentAdminSession();
  const canManageJobPostings = adminSession?.permissions.includes("JOB_POSTING_MANAGE") ?? false;
  let dashboard: AdminDashboard | null = null;
  let jobPostings: AdminJobPosting[] = [];
  let dashboardError: string | null = null;
  let jobPostingError: string | null = null;

  const [dashboardResult, jobPostingResult] = await Promise.allSettled([
    getAdminDashboard(),
    getAdminJobPostings(),
  ]);
  if (dashboardResult.status === "fulfilled") dashboard = dashboardResult.value;
  else dashboardError = dashboardResult.reason instanceof Error
    ? dashboardResult.reason.message
    : "운영 대시보드를 불러오지 못했습니다.";
  if (jobPostingResult.status === "fulfilled") jobPostings = jobPostingResult.value;
  else jobPostingError = jobPostingResult.reason instanceof Error
    ? jobPostingResult.reason.message
    : "관리자 공고 목록을 불러오지 못했습니다.";

  const groupedJobPostings = groupJobPostings(jobPostings);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-outline-variant bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
              운영 대시보드
            </p>
            <h1 className="mt-2 font-headline text-3xl font-semibold tracking-[-0.02em] text-on-surface">
              채용 운영 현황
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
              전체 지원자 큐, 검토 SLA, 면접, 평가와 통지 실패를 서버 집계 기준으로 확인합니다.
            </p>
            {dashboard ? (
              <p className="mt-2 text-xs text-on-surface-variant">
                기준 시각 {new Date(dashboard.generatedAt).toLocaleString("ko-KR")} · 검토 SLA {dashboard.reviewSlaHours}시간
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {canManageJobPostings ? (
              <Link
                href="/admin/job-postings/new"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                공고 등록
              </Link>
            ) : null}
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

        {dashboardError ? (
          <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-error-container px-4 py-4 text-sm text-destructive">
            {dashboardError}
          </p>
        ) : null}

        {dashboard ? (
          <div className="mt-7 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <OperationalCard
                label="신규 검토 대기"
                value={dashboard.reviewQueue.newApplicants}
                description="제출 후 검토가 시작되지 않은 지원자"
                href="/admin/applicants?applicationStatus=SUBMITTED&reviewStatus=NEW"
              />
              <OperationalCard
                label="SLA 초과"
                value={dashboard.reviewQueue.overdue}
                description={`${dashboard.reviewSlaHours}시간 이상 대기 중인 검토`}
                attention={dashboard.reviewQueue.overdue > 0}
                href="/admin/applicants?applicationStatus=SUBMITTED"
              />
              <OperationalCard
                label="오늘 면접"
                value={dashboard.interviews.today}
                description={`향후 7일 ${dashboard.interviews.upcomingSevenDays}건 예정`}
              />
              <OperationalCard
                label="처리 중단 통지"
                value={dashboard.notifications.exhausted}
                description={`재시도 중 ${dashboard.notifications.retrying}건`}
                attention={dashboard.notifications.exhausted > 0}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <MetricPanel
                title="지원서 흐름"
                metrics={[
                  ["오늘 제출", dashboard.applications.submittedToday],
                  ["최근 7일", dashboard.applications.submittedLastSevenDays],
                  ["전체 제출", dashboard.applications.submitted],
                  ["지원 철회", dashboard.applications.withdrawn],
                ]}
              />
              <MetricPanel
                title="검토 책임"
                metrics={[
                  ["검토 중", dashboard.reviewQueue.inReview],
                  ["미배정", dashboard.reviewQueue.unassigned],
                  ["최종 결정 대기", dashboard.reviewQueue.decisionPending],
                  ["평가 미작성", dashboard.interviews.pendingEvaluation],
                ]}
              />
              <MetricPanel
                title="처리 결과"
                metrics={[
                  ["서류 통과", dashboard.reviewQueue.passed],
                  ["서류 불합격", dashboard.reviewQueue.rejected],
                  ["발송 대기", dashboard.notifications.pending],
                  ["전체 지원서", dashboard.applications.total],
                ]}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-outline-variant bg-card p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary">공고 포트폴리오</p>
            <h2 className="mt-2 font-headline text-2xl font-semibold tracking-[-0.03em]">채용 공고 관리</h2>
          </div>
          {dashboard ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CompactStat label="전체" value={dashboard.jobPostings.total} />
              <CompactStat label="모집 중" value={dashboard.jobPostings.open} />
              <CompactStat label="공개" value={dashboard.jobPostings.published} />
              <CompactStat label="상시" value={dashboard.jobPostings.rolling} />
            </div>
          ) : null}
        </div>

        {jobPostingError ? (
          <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-error-container px-4 py-4 text-sm text-destructive">
            {jobPostingError}
          </p>
        ) : (
          <div className="mt-8 space-y-10">
            <PaginatedAdminJobPostingSection
              title="신입 채용"
              description="졸업 예정자와 초기 경력 지원자를 위한 공고입니다."
              jobPostings={groupedJobPostings.newGrad}
              emptyMessage="등록된 신입 채용 공고가 없습니다."
              canManage={canManageJobPostings}
            />
            <PaginatedAdminJobPostingSection
              title="경력 채용"
              description="즉시 투입 가능한 경력 지원자를 위한 공고입니다."
              jobPostings={groupedJobPostings.experienced}
              emptyMessage="등록된 경력 채용 공고가 없습니다."
              canManage={canManageJobPostings}
            />
            <PaginatedAdminJobPostingSection
              title="상시 채용"
              description="마감 없이 지원을 받는 공고입니다."
              jobPostings={groupedJobPostings.rolling}
              emptyMessage="등록된 상시 채용 공고가 없습니다."
              canManage={canManageJobPostings}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function OperationalCard({
  label,
  value,
  description,
  attention = false,
  href,
}: {
  label: string;
  value: number;
  description: string;
  attention?: boolean;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-semibold text-on-surface-variant">{label}</p>
      <p className={`mt-2 font-headline text-4xl font-bold tracking-[-0.04em] ${attention ? "text-destructive" : "text-on-surface"}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-on-surface-variant">{description}</p>
    </>
  );
  const className = `block rounded-lg border px-5 py-5 ${attention ? "border-destructive/40 bg-error-container/40" : "border-outline-variant bg-surface-container-lowest"}`;
  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

function MetricPanel({ title, metrics }: { title: string; metrics: Array<[string, number]> }) {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      <h3 className="font-headline text-lg font-semibold">{title}</h3>
      <dl className="mt-4 divide-y divide-outline-variant">
        {metrics.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
            <dt className="text-sm text-on-surface-variant">{label}</dt>
            <dd className="font-mono text-sm font-semibold text-on-surface">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function CompactStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[88px] rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-3 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline tabular-nums text-2xl font-semibold">{value}</p>
    </div>
  );
}
