import Link from "next/link";
import { notFound } from "next/navigation";

import type { CandidateApplicationDetail } from "@/entities/recruitment/model";
import { PublicSiteHeader } from "@/features/recruitment/layout/PublicSiteHeader";
import { JobPostingDetailView } from "@/features/recruitment/job-postings/JobPostingDetailView";
import {
  CandidateApiError,
  getCurrentCandidateSession,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import {
  ApiError,
  getCandidateApplicationForJobPosting,
  getJobPosting,
} from "@/shared/api/recruitment";
import {
  formatDateTime,
  getApplicationStatusClassName,
  getDraftAvailability,
} from "@/shared/lib/recruitment";

interface JobPostingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

type FlowStep = {
  label: string;
  state: "done" | "current" | "upcoming";
};

function getApplicationStatusText(application: CandidateApplicationDetail | null) {
  if (!application) {
    return "미지원";
  }

  return application.status === "SUBMITTED" ? "제출 완료" : "임시 저장";
}

function getFlowDescription(application: CandidateApplicationDetail | null) {
  if (!application) {
    return "아직 이 공고에 대한 지원을 시작하지 않았습니다.";
  }

  if (application.reviewStatus === "REJECTED") {
    return "제출된 지원서는 검토가 끝났고 결과가 반영되었습니다.";
  }

  if (
    application.finalStatus === "ACCEPTED" ||
    application.reviewStatus === "PASSED"
  ) {
    return "지원서 검토가 끝나 다음 채용 단계가 진행 중입니다.";
  }

  if (application.reviewStatus === "IN_REVIEW") {
    return "지원서가 접수되어 현재 채용팀이 검토 중입니다.";
  }

  if (application.status === "SUBMITTED") {
    return "지원서 제출이 완료되었습니다. 내 지원 내역에서 다시 확인할 수 있습니다.";
  }

  return "저장한 초안이 있습니다. 이어서 작성하거나 읽기 전용으로 확인할 수 있습니다.";
}

function getProgressLabel(application: CandidateApplicationDetail | null) {
  if (!application) {
    return "시작 전";
  }

  if (
    application.finalStatus === "ACCEPTED" ||
    application.reviewStatus === "PASSED"
  ) {
    return "다음 단계 진행";
  }

  if (application.reviewStatus === "REJECTED") {
    return "검토 완료";
  }

  if (application.reviewStatus === "IN_REVIEW") {
    return "검토 중";
  }

  if (application.status === "SUBMITTED") {
    return "제출 완료";
  }

  return "임시 저장";
}

function getFlowSteps(application: CandidateApplicationDetail | null): FlowStep[] {
  const hasDraft = Boolean(application);
  const isSubmitted = application?.status === "SUBMITTED";
  const isInReview = application?.reviewStatus === "IN_REVIEW";
  const isResolved =
    application?.reviewStatus === "PASSED" ||
    application?.reviewStatus === "REJECTED" ||
    application?.finalStatus === "ACCEPTED" ||
    application?.finalStatus === "DECLINED";

  return [
    {
      label: "작성",
      state: hasDraft && !isSubmitted ? "current" : hasDraft ? "done" : "current",
    },
    {
      label: "제출",
      state: isSubmitted ? "done" : "upcoming",
    },
    {
      label: "검토",
      state: isInReview ? "current" : isResolved ? "done" : "upcoming",
    },
    {
      label: "결과",
      state: isResolved ? "current" : "upcoming",
    },
  ];
}

function getFlowStepClassName(step: FlowStep["state"]) {
  switch (step) {
    case "done":
      return "border-transparent bg-primary text-primary-foreground";
    case "current":
      return "border-primary bg-primary/10 text-primary";
    default:
      return "border-outline-variant bg-surface-container-low text-on-surface-variant";
  }
}

function CandidateApplicationStatusCard({
  application,
  jobPostingId,
  canSave = true,
  unavailableReason,
}: {
  application: CandidateApplicationDetail | null;
  jobPostingId: number;
  canSave?: boolean;
  unavailableReason?: string;
}) {
  const flowSteps = getFlowSteps(application);

  const primaryAction = (() => {
    if (!application) {
      return canSave
        ? {
            href: `/job-postings/${jobPostingId}/apply`,
            label: "지원하기",
          }
        : null;
    }

    if (application.status === "DRAFT") {
      return canSave
        ? {
            href: `/job-postings/${jobPostingId}/apply`,
            label: "이어서 작성",
          }
        : {
            href: `/me/applications/${application.applicationId}`,
            label: "초안 보기",
          };
    }

    return {
      href: `/me/applications/${application.applicationId}`,
      label: "지원서 보기",
    };
  })();

  return (
    <section className="rounded-sm border border-outline-variant bg-card p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
            지원 현황
          </p>
          <h2 className="mt-3 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            내 현재 상태
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            application
              ? getApplicationStatusClassName(application.status)
              : "bg-stone-200 text-stone-700"
          }`}
        >
          {getApplicationStatusText(application)}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-on-surface-variant">
        {getFlowDescription(application)}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {flowSteps.map((step, index) => (
          <div
            key={step.label}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-center"
          >
            <span
              className={`mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${getFlowStepClassName(
                step.state,
              )}`}
            >
              {index + 1}
            </span>
            <p className="mt-2 text-sm font-semibold text-on-surface">{step.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">
        <div className="flex items-center justify-between gap-4">
          <span>현재 상태</span>
          <span className="font-medium text-on-surface">
            {getProgressLabel(application)}
          </span>
        </div>
        {application ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <span>마지막 저장</span>
              <span className="font-medium text-on-surface">
                {formatDateTime(application.draftSavedAt)}
              </span>
            </div>
            {application.submittedAt ? (
              <div className="flex items-center justify-between gap-4">
                <span>제출 시간</span>
                <span className="font-medium text-on-surface">
                  {formatDateTime(application.submittedAt)}
                </span>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="mt-5 space-y-2">
        {primaryAction ? (
          <Link
            href={primaryAction.href}
            className="inline-flex rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
          >
            {primaryAction.label}
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed rounded-sm bg-primary/50 px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground">
            모집 마감
          </span>
        )}

        {application ? (
          <Link
            href="/me"
            className="block text-sm text-on-surface-variant transition-colors hover:text-primary"
          >
            내 지원 내역으로 이동
          </Link>
        ) : null}

        {!primaryAction && unavailableReason ? (
          <p className="text-sm text-on-surface-variant">{unavailableReason}</p>
        ) : null}
      </div>
    </section>
  );
}

function CandidateLoginGate({
  loginHref,
  signupHref,
}: {
  loginHref: string;
  signupHref: string;
}) {
  return (
    <section className="rounded-sm border border-outline-variant bg-card p-7">
      <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
        로그인 후 지원할 수 있습니다
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
        로그인하면 지원서 작성, 임시 저장, 최종 제출, 내 지원 내역 확인까지 이어서 진행할 수 있습니다.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={loginHref}
          className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
        >
          로그인하고 지원
        </Link>
        <Link
          href={signupHref}
          className="rounded-sm border border-outline-variant px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-on-surface"
        >
          회원가입
        </Link>
      </div>
    </section>
  );
}

function CandidateApplicationLoadErrorCard({ message }: { message: string }) {
  return (
    <section className="rounded-sm border border-error/30 bg-card p-7">
      <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
        지원 정보를 불러오지 못했습니다
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">{message}</p>
      <div className="mt-6">
        <Link
          href="/me"
          className="inline-flex rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
        >
          내 지원 내역 보기
        </Link>
      </div>
    </section>
  );
}

export default async function JobPostingDetailPage({
  params,
}: JobPostingDetailPageProps) {
  const { id } = await params;
  const jobPostingId = Number(id);

  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0) {
    notFound();
  }

  const [jobPosting, candidateSession] = await Promise.all([
    getJobPosting(jobPostingId),
    getCurrentCandidateSession().catch(() => null),
  ]);

  if (!jobPosting) {
    notFound();
  }

  let candidateApplication: CandidateApplicationDetail | null = null;
  let candidateApplicationLoadError: string | null = null;

  if (candidateSession) {
    try {
      const sessionToken = await getRequiredCandidateSessionToken();
      candidateApplication = await getCandidateApplicationForJobPosting(
        jobPostingId,
        sessionToken,
      );
    } catch (error) {
      if (
        (error instanceof ApiError || error instanceof CandidateApiError) &&
        error.status === 404
      ) {
        candidateApplication = null;
      } else if (error instanceof ApiError || error instanceof CandidateApiError) {
        candidateApplicationLoadError = error.message;
      } else {
        candidateApplicationLoadError =
          "지원 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      }
    }
  }

  const draftAvailability = getDraftAvailability(jobPosting);
  const next = encodeURIComponent(`/job-postings/${jobPosting.id}/apply`);
  const loginHref = `/auth/login?next=${next}`;
  const signupHref = `/auth/login?mode=signup&next=${next}`;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicSiteHeader activePath={`/job-postings/${jobPosting.id}`} />

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-16">
        <JobPostingDetailView
          jobPosting={jobPosting}
          applicationSlot={
            candidateSession ? (
              candidateApplicationLoadError ? (
                <CandidateApplicationLoadErrorCard
                  message={candidateApplicationLoadError}
                />
              ) : (
                <CandidateApplicationStatusCard
                  application={candidateApplication}
                  jobPostingId={jobPosting.id}
                  canSave={draftAvailability.canSave}
                  unavailableReason={
                    !draftAvailability.canSave ? draftAvailability.reason : undefined
                  }
                />
              )
            ) : (
              <CandidateLoginGate loginHref={loginHref} signupHref={signupHref} />
            )
          }
        />
      </main>
    </div>
  );
}
