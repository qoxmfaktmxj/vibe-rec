import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CandidateLogoutButton } from "@/features/recruitment/application/CandidateLogoutButton";
import { CandidateApplicationReadOnlyView } from "@/features/recruitment/application/CandidateApplicationReadOnlyView";
import {
  getCurrentCandidateSession,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import {
  getCandidateApplicationAttachments,
  getCandidateApplicationForJobPosting,
  getCandidateApplications,
  getJobPostingQuestions,
} from "@/shared/api/recruitment";

interface CandidateApplicationDetailPageProps {
  params: Promise<{
    applicationId: string;
  }>;
}

export default async function CandidateApplicationDetailPage({
  params,
}: CandidateApplicationDetailPageProps) {
  const { applicationId } = await params;
  const numericApplicationId = Number(applicationId);

  if (!Number.isInteger(numericApplicationId) || numericApplicationId <= 0) {
    notFound();
  }

  const session = await getCurrentCandidateSession().catch(() => null);
  if (!session) {
    redirect(
      `/auth/login?next=${encodeURIComponent(`/me/applications/${numericApplicationId}`)}`,
    );
  }

  const sessionToken = await getRequiredCandidateSessionToken();
  const applications = await getCandidateApplications(sessionToken).catch(
    () => [],
  );
  const summary = applications.find(
    (application) => application.applicationId === numericApplicationId,
  );

  if (!summary) {
    notFound();
  }

  const [application, questions, attachments] = await Promise.all([
    getCandidateApplicationForJobPosting(summary.jobPostingId, sessionToken),
    getJobPostingQuestions(summary.jobPostingId).catch(() => []),
    getCandidateApplicationAttachments(numericApplicationId, sessionToken).catch(
      () => [],
    ),
  ]);

  if (!application || application.applicationId !== numericApplicationId) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-on-surface md:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <Link
              href="/me"
              className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
            >
              내 지원 내역으로 돌아가기
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                지원서 문서
              </p>
              <h1 className="mt-2 font-headline text-4xl font-medium tracking-[-0.05em] text-on-surface">
                제출한 지원 내용을 다시 확인합니다
              </h1>
            </div>
          </div>
          <CandidateLogoutButton redirectTo="/" />
        </div>

        <CandidateApplicationReadOnlyView
          application={application}
          summary={summary}
          questions={questions}
          attachments={attachments}
        />
      </div>
    </main>
  );
}
