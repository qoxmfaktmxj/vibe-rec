import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApplicationWizard } from "@/features/recruitment/application/ApplicationWizard";
import { PublicSiteHeader } from "@/features/recruitment/layout/PublicSiteHeader";
import {
  getCurrentCandidateSession,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import {
  getCandidateApplicationForJobPosting,
  getJobPosting,
  getJobPostingQuestions,
} from "@/shared/api/recruitment";
import { isJobPostingOpenForApplications } from "@/shared/lib/recruitment";

interface ApplyPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { id } = await params;
  const jobPostingId = Number(id);

  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0) {
    notFound();
  }

  const candidateSession = await getCurrentCandidateSession().catch(() => null);
  if (!candidateSession) {
    redirect(`/auth/login?next=${encodeURIComponent(`/job-postings/${jobPostingId}/apply`)}`);
  }

  const sessionToken = await getRequiredCandidateSessionToken();

  const [jobPosting, existingApplication, questionsResult] = await Promise.all([
    getJobPosting(jobPostingId),
    getCandidateApplicationForJobPosting(jobPostingId, sessionToken).catch(() => null),
    getJobPostingQuestions(jobPostingId)
      .then((questions) => ({
        customQuestions: questions,
        questionsLoadError: false,
      }))
      .catch(() => ({
        customQuestions: null,
        questionsLoadError: true,
      })),
  ]);
  const { customQuestions, questionsLoadError } = questionsResult;

  if (!jobPosting) {
    notFound();
  }

  if (questionsLoadError || customQuestions === null) {
    return (
      <div className="min-h-screen bg-background text-on-surface">
        <PublicSiteHeader activePath={`/job-postings/${jobPostingId}/apply`} />
        <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-6 py-16 md:px-16">
          <div className="rounded-xl border border-destructive/30 bg-error-container px-8 py-10 text-center">
            <p className="font-headline text-xl font-medium text-destructive">지원서 양식을 불러오지 못했습니다</p>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              잠시 후 다시 시도하거나, 문제가 계속되면 채용 담당자에게 문의해 주세요.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href={`/job-postings/${jobPostingId}/apply`}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                다시 시도
              </Link>
              <Link
                href={`/job-postings/${jobPostingId}`}
                className="rounded-lg border border-outline-variant px-6 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                공고로 돌아가기
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Submitted applications should be viewed from the candidate workspace.
  if (existingApplication && existingApplication.status !== "DRAFT") {
    redirect(`/me/applications/${existingApplication.applicationId}`);
  }

  // Drafts become read-only once the posting is no longer open.
  if (
    existingApplication?.status === "DRAFT" &&
    !isJobPostingOpenForApplications(jobPosting)
  ) {
    redirect(`/me/applications/${existingApplication.applicationId}`);
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicSiteHeader activePath={`/job-postings/${jobPostingId}/apply`} />

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-6 py-10 md:px-16">
        <ApplicationWizard
          candidateSession={candidateSession}
          jobPostingId={jobPostingId}
          jobPostingTitle={jobPosting.title}
          initialApplication={existingApplication}
          customQuestions={customQuestions}
        />
      </main>
    </div>
  );
}
