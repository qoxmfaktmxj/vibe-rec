import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationDraftForm } from "@/features/recruitment/application/ApplicationDraftForm";
import { JobPostingDetailView } from "@/features/recruitment/job-postings/JobPostingDetailView";
import { getCurrentCandidateSession } from "@/shared/api/candidate-auth";
import { getJobPosting } from "@/shared/api/recruitment";
import { getDraftAvailability } from "@/shared/lib/recruitment";

interface JobPostingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
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

  const draftAvailability = getDraftAvailability(jobPosting);
  const next = encodeURIComponent(`/job-postings/${jobPosting.id}`);
  const loginHref = `/auth/login?next=${next}`;
  const signupHref = `/auth/login?mode=signup&next=${next}`;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="glass-nav sticky top-0 z-50 border-b border-outline-variant px-6 py-4 md:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link
            href="/"
            className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface"
          >
            Vibe Rec
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
              <ApplicationDraftForm
                candidateSession={candidateSession}
                jobPostingId={jobPosting.id}
                canSave={draftAvailability.canSave}
                helperText={draftAvailability.reason}
              />
            ) : (
              <CandidateLoginGate loginHref={loginHref} signupHref={signupHref} />
            )
          }
        />
      </main>
    </div>
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
    <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-7">
      <h2 className="font-headline text-2xl font-bold text-on-surface">
        지원하려면 로그인해 주세요
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        회원가입과 로그인 이후에만 지원서를 저장하고 제출할 수 있습니다.
        지원자 계정 정보가 지원서 작성의 기본값으로 사용됩니다.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={loginHref}
          className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          지원자 로그인
        </Link>
        <Link
          href={signupHref}
          className="rounded-sm border border-outline-variant px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-on-surface transition-colors hover:border-primary hover:text-primary"
        >
          회원가입
        </Link>
      </div>
    </section>
  );
}

