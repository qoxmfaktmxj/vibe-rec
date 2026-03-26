import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApplicationWizard } from "@/features/recruitment/application/ApplicationWizard";
import {
  getCurrentCandidateSession,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import {
  getCandidateApplicationForJobPosting,
  getJobPosting,
  getJobPostingQuestions,
} from "@/shared/api/recruitment";

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

  const [jobPosting, existingApplication, customQuestions] = await Promise.all([
    getJobPosting(jobPostingId),
    getCandidateApplicationForJobPosting(jobPostingId, sessionToken).catch(() => null),
    getJobPostingQuestions(jobPostingId).catch(() => []),
  ]);

  if (!jobPosting) {
    notFound();
  }

  // If already submitted, redirect to detail page
  if (existingApplication?.status === "SUBMITTED") {
    redirect(`/job-postings/${jobPostingId}`);
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="sticky top-0 z-50 border-b border-outline-variant bg-background/95 px-6 py-4 backdrop-blur md:px-16">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-6">
          <Link
            href="/"
            className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface"
          >
            HireFlow
          </Link>
          <Link
            href={`/job-postings/${jobPostingId}`}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant transition-colors hover:text-primary"
          >
            공고로 돌아가기
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-10 md:px-16">
        <ApplicationWizard
          candidateSession={candidateSession}
          sessionToken={sessionToken}
          jobPostingId={jobPostingId}
          jobPostingTitle={jobPosting.title}
          initialApplication={existingApplication}
          customQuestions={customQuestions}
        />
      </main>
    </div>
  );
}
