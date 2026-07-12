import Link from "next/link";
import { redirect } from "next/navigation";

import { CandidateLogoutButton } from "@/features/recruitment/application/CandidateLogoutButton";
import { CandidateApplicationsPanel } from "@/features/recruitment/application/CandidateApplicationsPanel";
import {
  getCurrentCandidateSession,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import { getCandidateApplications } from "@/shared/api/recruitment";

interface MyPageProps {
  searchParams: Promise<{ submitted?: string }>;
}

export default async function MyPage({ searchParams }: MyPageProps) {
  const params = await searchParams;
  const justSubmitted = params.submitted === "1";
  const session = await getCurrentCandidateSession();

  if (!session) {
    redirect("/auth/login?next=/me");
  }

  const sessionToken = await getRequiredCandidateSessionToken();
  const applicationsResult = await getCandidateApplications(sessionToken)
    .then((applications) => ({
      applications,
      applicationsError: false,
    }))
    .catch(() => ({
      applications: [],
      applicationsError: true,
    }));
  const { applications, applicationsError } = applicationsResult;
  const submittedCount = applications.filter(
    (application) => application.status === "SUBMITTED",
  ).length;

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-on-surface md:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        {justSubmitted && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4"
          >
            <p className="font-semibold text-emerald-900">지원서가 성공적으로 제출되었습니다!</p>
            <p className="mt-1 text-sm text-emerald-800">
              채용팀이 검토 후 연락드릴 예정입니다. 아래에서 지원 현황을 확인하세요.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              지원자 워크스페이스
            </p>
            <h1 className="mt-2 font-headline text-3xl font-semibold tracking-[-0.02em] text-on-surface">
              {session.name}님, 환영합니다
            </h1>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              이 계정 정보와 지원 내역을 한 곳에서 확인할 수 있습니다.
            </p>
          </div>
          <CandidateLogoutButton redirectTo="/" />
        </div>

        <section className="rounded-xl border border-outline-variant bg-card p-6 elevation-1">
          <dl className="grid gap-5 text-sm md:grid-cols-2">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
                이메일
              </dt>
              <dd className="mt-1.5 text-on-surface">{session.email}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
                휴대전화
              </dt>
              <dd className="mt-1.5 text-on-surface">{session.phone}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
                로그인 시각
              </dt>
              <dd className="mt-1.5 font-mono text-xs tabular-nums text-on-surface">
                {new Date(session.authenticatedAt).toLocaleString("ko-KR")}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
                세션 만료
              </dt>
              <dd className="mt-1.5 font-mono text-xs tabular-nums text-on-surface">
                {new Date(session.expiresAt).toLocaleString("ko-KR")}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-outline-variant bg-card p-6 elevation-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-lg font-semibold tracking-[-0.01em] text-on-surface">
                프로필 관리
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                이력서 정보를 미리 작성해 두면 공고 지원 시 빠르게 불러올 수 있습니다.
              </p>
            </div>
            <Link
              href="/profile"
              className="shrink-0 rounded-lg border border-outline-variant px-5 py-3 text-sm font-semibold text-on-surface transition-colors hover:border-brand hover:text-brand"
            >
              프로필 편집
            </Link>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                지원 내역 보기
              </p>
              <h2 className="mt-2 font-headline text-2xl font-semibold tracking-[-0.015em] text-on-surface">
                내 지원 내역
              </h2>
              <p className="mt-2 font-mono text-xs tabular-nums text-on-surface-variant">
                전체 {applications.length}건 · 제출 {submittedCount}건
              </p>
            </div>
            {applications.length > 0 ? (
              <Link
                href="/job-postings"
                className="rounded-lg border border-outline-variant px-5 py-3 text-sm font-semibold text-on-surface transition-colors hover:border-brand hover:text-brand"
              >
                공고 보러 가기
              </Link>
            ) : null}
          </div>

          {applicationsError ? (
            <section className="rounded-xl border border-outline-variant bg-card p-8 elevation-1">
              <h3 className="font-headline text-xl font-semibold text-on-surface">
                지원 내역을 불러오지 못했습니다.
              </h3>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                잠시 후 다시 시도해 주세요.
              </p>
            </section>
          ) : applications.length === 0 ? (
            <section className="rounded-xl border border-outline-variant bg-card p-10 text-center elevation-1">
              <h3 className="font-headline text-xl font-semibold text-on-surface">
                아직 지원한 공고가 없습니다
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-on-surface-variant">
                관심 있는 공고에 지원하면 이 화면에서 작성부터 결과까지 진행 상태를 한눈에
                확인할 수 있습니다.
              </p>
              <Link
                href="/job-postings"
                className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                채용 공고 보러 가기
              </Link>
            </section>
          ) : (
            <section className="rounded-xl border border-outline-variant bg-card p-6 elevation-1">
              <CandidateApplicationsPanel applications={applications} pageSize={30} />
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
