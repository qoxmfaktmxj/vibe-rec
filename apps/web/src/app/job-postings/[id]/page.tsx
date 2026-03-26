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

function getApplicationStatusText(application: CandidateApplicationDetail | null) {
  if (!application) {
    return "No application";
  }

  return application.status === "SUBMITTED" ? "Submitted" : "Draft saved";
}

function getApplicationHelperText(application: CandidateApplicationDetail | null) {
  if (!application) {
    return "Sign in to start an application, save a draft, or submit it.";
  }

  if (application.status === "SUBMITTED") {
    return "This application has already been submitted. Track the current status below.";
  }

  return "A saved draft is available. You can continue from the last saved point.";
}

function getFlowDescription(application: CandidateApplicationDetail | null) {
  if (!application) {
    return "You have not started an application for this posting yet.";
  }

  if (
    application.finalStatus === "ACCEPTED" ||
    application.reviewStatus === "PASSED"
  ) {
    return "Your application has moved to the next stage. Check the latest updates below.";
  }

  if (application.reviewStatus === "REJECTED") {
    return "This application is no longer moving forward.";
  }

  if (application.reviewStatus === "IN_REVIEW") {
    return "Your application has been received and is currently under review.";
  }

  if (application.status === "SUBMITTED") {
    return "Your application has been submitted successfully.";
  }

  return "A saved draft is available. You can continue editing it.";
}

function getProgressLabel(application: CandidateApplicationDetail | null) {
  if (!application) {
    return "Not started";
  }

  if (
    application.finalStatus === "ACCEPTED" ||
    application.reviewStatus === "PASSED"
  ) {
    return "Passed";
  }

  if (application.reviewStatus === "REJECTED") {
    return "Rejected";
  }

  if (application.reviewStatus === "IN_REVIEW") {
    return "In review";
  }

  if (application.status === "SUBMITTED") {
    return "Submitted";
  }

  return "Draft";
}

type FlowStep = {
  label: string;
  description: string;
  state: "done" | "current" | "upcoming";
};

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
      label: "Write",
      description: hasDraft
        ? "Continue editing your saved application."
        : "Start the application with your account profile.",
      state: hasDraft && !isSubmitted ? "current" : hasDraft ? "done" : "current",
    },
    {
      label: "Submit",
      description: isSubmitted
        ? "The application was submitted successfully."
        : "Review your answers and submit the final version.",
      state: isSubmitted ? "done" : "upcoming",
    },
    {
      label: "Review",
      description: isInReview
        ? "The hiring team is reviewing your application."
        : "The status will update when review begins.",
      state: isInReview ? "current" : isFinalized ? "done" : "upcoming",
    },
    {
      label: "Result",
      description:
        application?.reviewStatus === "PASSED"
          ? "Watch for the next-stage instructions."
          : application?.reviewStatus === "REJECTED"
            ? "The final result for this posting is available."
            : "You can check the outcome here once the review is complete.",
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
            Application flow
          </p>
          <h2 className="mt-3 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            Your status
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
          <span>Current progress</span>
          <span className="font-medium text-on-surface">
            {getProgressLabel(application)}
          </span>
        </div>
        {application ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <span>Last saved</span>
              <span className="font-medium text-on-surface">
                {formatDateTime(application.draftSavedAt)}
              </span>
            </div>
            {application.submittedAt ? (
              <div className="flex items-center justify-between gap-4">
                <span>Submitted at</span>
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
              ? "Continue"
              : "View applications"
            : "Start application"}
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
        Sign in to apply
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
        After signing in, you can start an application, save drafts, and submit when ready.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={loginHref}
          className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
        >
          Candidate login
        </Link>
        <Link
          href={signupHref}
          className="rounded-sm border border-outline-variant px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-on-surface"
        >
          Sign up
        </Link>
      </div>
    </section>
  );
}

function CandidateApplicationLoadErrorCard({ message }: { message: string }) {
  return (
    <section className="rounded-sm border border-error/30 bg-card p-7">
      <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
        Could not load your saved application
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">{message}</p>
      <div className="mt-6">
        <Link
          href="/me"
          className="inline-flex rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
        >
          View applications
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

  const [jobPosting, candidateSession, questions] = await Promise.all([
    getJobPosting(jobPostingId),
    getCurrentCandidateSession().catch(() => null),
    getJobPostingQuestions(jobPostingId).catch(() => [] as JobPostingQuestion[]),
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
          "Please try again later. If the problem continues, contact an administrator.";
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
            Back to postings
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
              ) : (
                <div className="space-y-6">
                  <CandidateApplicationStatusCard application={candidateApplication} />
                  <div id="application-form">
                    <ApplicationDraftForm
                      candidateSession={candidateSession}
                      jobPostingId={jobPosting.id}
                      canSave={draftAvailability.canSave}
                      helperText={
                        candidateApplication
                          ? getApplicationHelperText(candidateApplication)
                          : draftAvailability.reason
                      }
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
