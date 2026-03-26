import Link from "next/link";
import { redirect } from "next/navigation";

import { CandidateLogoutButton } from "@/features/recruitment/application/CandidateLogoutButton";
import {
  getCurrentCandidateSession,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import { getCandidateApplications } from "@/shared/api/recruitment";
import {
  formatDateTime,
  getApplicationStatusClassName,
  getApplicationReviewStatusClassName,
} from "@/shared/lib/recruitment";

function getApplicationStatusText(status: "DRAFT" | "SUBMITTED") {
  return status === "SUBMITTED" ? "제출 완료" : "임시저장";
}

function getReviewStatusText(
  status: "NEW" | "IN_REVIEW" | "PASSED" | "REJECTED",
) {
  switch (status) {
    case "NEW":
      return "검토 대기";
    case "IN_REVIEW":
      return "검토 중";
    case "PASSED":
      return "합격";
    case "REJECTED":
      return "불합격";
    default:
      return status;
  }
}

export default async function MyPage() {
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

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-on-surface md:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              지원자 워크스페이스
            </p>
            <h1 className="mt-3 font-headline text-4xl font-medium tracking-[-0.05em]">
              {session.name}
            </h1>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              내 계정 정보와 지원 내역을 한 곳에서 확인할 수 있습니다.
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
                지원 내역 보관함
              </p>
              <h2 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em]">
                내 지원 내역
              </h2>
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
                지원 내역을 불러오지 못했습니다
              </h3>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                잠시 후 다시 시도해 주세요.
              </p>
            </section>
          ) : applications.length === 0 ? (
            <section className="rounded-sm border border-outline-variant bg-card p-8">
              <h3 className="font-headline text-2xl font-medium text-on-surface">
                아직 지원한 공고가 없습니다
              </h3>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                관심 있는 공고를 둘러보고 지원서를 작성해 보세요.
              </p>
            </section>
          ) : (
            <div className="grid gap-4">
              {applications.map((application) => (
                <article
                  key={application.applicationId}
                  className="rounded-sm border border-outline-variant bg-card p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-headline text-2xl font-medium tracking-[-0.03em] text-on-surface">
                        {application.jobPostingTitle}
                      </h3>
                      <p className="text-sm leading-7 text-on-surface-variant">
                        {application.jobPostingHeadline}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                        {application.location} · {application.employmentType}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getApplicationStatusClassName(
                          application.status,
                        )}`}
                      >
                        {getApplicationStatusText(application.status)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getApplicationReviewStatusClassName(
                          application.reviewStatus,
                        )}`}
                      >
                        {getReviewStatusText(application.reviewStatus)}
                      </span>
                    </div>
                  </div>

                  <dl className="mt-5 grid gap-3 text-sm text-on-surface-variant md:grid-cols-2">
                    <div>
                      <dt>마지막 저장일</dt>
                      <dd className="mt-1 font-medium text-on-surface">
                        {formatDateTime(application.draftSavedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt>제출일</dt>
                      <dd className="mt-1 font-medium text-on-surface">
                        {formatDateTime(application.submittedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/job-postings/${application.jobPostingId}`}
                      className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
                    >
                      {application.status === "DRAFT"
                        ? "이어서 작성"
                        : "공고에서 진행 상태 보기"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
