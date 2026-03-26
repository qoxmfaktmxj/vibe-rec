import Link from "next/link";
import { notFound } from "next/navigation";

import type {
  CandidateApplicationDetail,
  JobPostingQuestion,
} from "@/entities/recruitment/model";
import { ApplicationDraftForm } from "@/features/recruitment/application/ApplicationDraftForm";
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
  getJobPostingQuestions,
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
  description: string;
  state: "done" | "current" | "upcoming";
};

function getApplicationStatusText(application: CandidateApplicationDetail | null) {
  if (!application) {
    return "지원 전";
  }

  return application.status === "SUBMITTED" ? "제출 완료" : "임시 저장";
}

function getApplicationHelperText(
  application: CandidateApplicationDetail | null,
  availability: ReturnType<typeof getDraftAvailability>,
) {
  if (!application) {
    return availability.reason;
  }

  if (application.status === "SUBMITTED") {
    return "이미 제출이 완료된 지원서입니다. 진행 상황은 아래에서 계속 확인할 수 있습니다.";
  }

  if (!availability.canSave) {
    return availability.reason;
  }

  return "저장된 초안이 있습니다. 마지막으로 작성하던 위치부터 이어서 수정할 수 있습니다.";
}

function getFlowDescription(application: CandidateApplicationDetail | null) {
  if (!application) {
    return "아직 이 공고에 대한 지원을 시작하지 않았습니다.";
  }

  if (
    application.finalStatus === "ACCEPTED" ||
    application.reviewStatus === "PASSED"
  ) {
    return "다음 단계로 진행 중입니다. 최신 상태를 아래에서 확인해 주세요.";
  }

  if (application.reviewStatus === "REJECTED") {
    return "이번 공고에 대한 전형은 종료되었습니다.";
  }

  if (application.reviewStatus === "IN_REVIEW") {
    return "지원서가 접수되어 현재 검토가 진행 중입니다.";
  }

  if (application.status === "SUBMITTED") {
    return "지원서 제출이 완료되었습니다.";
  }

  return "저장된 초안이 있습니다. 이어서 작성할 수 있습니다.";
}

function getProgressLabel(application: CandidateApplicationDetail | null) {
  if (!application) {
    return "시작 전";
  }

  if (
    application.finalStatus === "ACCEPTED" ||
    application.reviewStatus === "PASSED"
  ) {
    return "합격";
  }

  if (application.reviewStatus === "REJECTED") {
    return "불합격";
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
  const isFinalized =
    application?.reviewStatus === "PASSED" ||
    application?.reviewStatus === "REJECTED" ||
    application?.finalStatus === "ACCEPTED" ||
    application?.finalStatus === "DECLINED";

  return [
    {
      label: "작성",
      description: hasDraft
        ? "저장된 지원서를 계속 수정합니다."
        : "계정 정보 기반으로 지원서를 작성합니다.",
      state: hasDraft && !isSubmitted ? "current" : hasDraft ? "done" : "current",
    },
    {
      label: "제출",
      description: isSubmitted
        ? "최종 제출이 완료되었습니다."
        : "작성한 내용을 검토하고 제출합니다.",
      state: isSubmitted ? "done" : "upcoming",
    },
    {
      label: "검토",
      description: isInReview
        ? "채용팀에서 지원서를 검토하고 있습니다."
        : "검토가 시작되면 상태가 업데이트됩니다.",
      state: isInReview ? "current" : isFinalized ? "done" : "upcoming",
    },
    {
      label: "결과",
      description:
        application?.reviewStatus === "PASSED"
          ? "다음 단계 안내를 확인해 주세요."
          : application?.reviewStatus === "REJECTED"
            ? "최종 결과가 반영되었습니다."
            : "검토가 끝나면 결과를 여기서 확인할 수 있습니다.",
      state: isFinalized ? "current" : "upcoming",
    },
  ];
}

function getFlowStepClassName(state: FlowStep["state"]) {
  switch (state) {
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
}: {
  application: CandidateApplicationDetail | null;
}) {
  const flowSteps = getFlowSteps(application);

  return (
    <section className="rounded-sm border border-outline-variant bg-card p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
            지원 흐름
          </p>
          <h2 className="mt-3 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            내 지원 상태
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

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {flowSteps.map((step, index) => (
          <div
            key={step.label}
            className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${getFlowStepClassName(
                  step.state,
                )}`}
              >
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-on-surface">{step.label}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              {step.description}
            </p>
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
                <span>제출 일시</span>
                <span className="font-medium text-on-surface">
                  {formatDateTime(application.submittedAt)}
                </span>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="mt-5">
        <Link
          href={application?.status === "SUBMITTED" ? "/me" : "#application-form"}
          className="inline-flex rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
        >
          {application
            ? application.status === "DRAFT"
              ? "계속 작성"
              : "내 지원 내역 보기"
            : "지원 시작"}
        </Link>
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
        로그인하면 지원서 작성, 임시 저장, 최종 제출까지 한 흐름으로 진행할 수 있습니다.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={loginHref}
          className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
        >
          지원자 로그인
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
        저장된 지원서를 불러오지 못했습니다
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

function CandidateQuestionLoadErrorCard({ message }: { message: string }) {
  return (
    <section className="rounded-sm border border-error/30 bg-card p-7">
      <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
        지원 문항을 불러오지 못했습니다
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">{message}</p>
      <p className="mt-2 text-sm leading-7 text-on-surface-variant">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
      </p>
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

  let questions: JobPostingQuestion[] = [];
  let questionLoadError: string | null = null;

  try {
    questions = await getJobPostingQuestions(jobPostingId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      questions = [];
    } else {
      questionLoadError =
        error instanceof Error
          ? error.message
          : "지원 문항을 불러오지 못했습니다.";
    }
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
          "잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.";
      }
    }
  }

  const draftAvailability = getDraftAvailability(jobPosting);
  const next = encodeURIComponent(`/job-postings/${jobPosting.id}`);
  const loginHref = `/auth/login?next=${next}`;
  const signupHref = `/auth/login?mode=signup&next=${next}`;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="sticky top-0 z-50 border-b border-outline-variant bg-background/95 px-6 py-4 backdrop-blur md:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link
            href="/"
            className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface"
          >
            HireFlow
          </Link>
          <Link
            href="/job-postings"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant transition-colors hover:text-primary"
          >
            공고 목록으로
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-16">
        <JobPostingDetailView
          jobPosting={jobPosting}
          applicationSlot={
            candidateSession ? (
              candidateApplicationLoadError ? (
                <CandidateApplicationLoadErrorCard
                  message={candidateApplicationLoadError}
                />
              ) : questionLoadError ? (
                <CandidateQuestionLoadErrorCard message={questionLoadError} />
              ) : (
                <div className="space-y-6">
                  <CandidateApplicationStatusCard application={candidateApplication} />
                  <div id="application-form">
                    <ApplicationDraftForm
                      candidateSession={candidateSession}
                      jobPostingId={jobPosting.id}
                      canSave={draftAvailability.canSave}
                      helperText={getApplicationHelperText(
                        candidateApplication,
                        draftAvailability,
                      )}
                      initialApplication={candidateApplication}
                      questions={questions}
                    />
                  </div>
                </div>
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
