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
            className="rounded-sm border border-emerald-200 bg-emerald-50 px-6 py-4"
          >
            <p className="font-semibold text-emerald-900">지원서가 성공적으로 제출되었습니다!</p>
            <p className="mt-1 text-sm text-emerald-800">
              채용팀이 검토 후 연락드릴 예정입니다. 아래에서 지원 현황을 확인하세요.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              지원자 워크스페이스
            </p>
            <h1 className="mt-3 font-headline text-4xl font-medium tracking-[-0.05em]">
              {session.name}
            </h1>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              이 계정 정보와 지원 내역을 한 곳에서 확인할 수 있습니다.
            </p>
          </div>
          <CandidateLogoutButton redirectTo="/" />
        </div>

        <section className="rounded-sm border border-outline-variant bg-card p-6">
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-on-surface-variant">이메일</dt>
              <dd className="mt-1 font-medium">{session.email}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">휴대전화</dt>
              <dd className="mt-1 font-medium">{session.phone}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">로그인 시각</dt>
              <dd className="mt-1 font-medium">
                {new Date(session.authenticatedAt).toLocaleString("ko-KR")}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">세션 만료</dt>
              <dd className="mt-1 font-medium">
                {new Date(session.expiresAt).toLocaleString("ko-KR")}
              </dd>
            </div>
          </dl>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                지원 내역 보기
              </p>
              <h2 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em]">
                내 지원 내역
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                전체 {applications.length}건, 제출 완료 {submittedCount}건
              </p>
            </div>
            <Link
              href="/job-postings"
              className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
            >
              공고 보러 가기
            </Link>
          </div>

          {applicationsError ? (
            <section className="rounded-sm border border-outline-variant bg-card p-8">
              <h3 className="font-headline text-2xl font-medium text-on-surface">
                지원 내역을 불러오지 못했습니다.
              </h3>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                잠시 후 다시 시도해 주세요.
              </p>
            </section>
          ) : (
            <section className="rounded-sm border border-outline-variant bg-card p-6">
              <CandidateApplicationsPanel applications={applications} pageSize={30} />
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
