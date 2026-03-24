import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationDraftForm } from "@/features/recruitment/application/ApplicationDraftForm";
import { JobPostingDetailView } from "@/features/recruitment/job-postings/JobPostingDetailView";
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

  const jobPosting = await getJobPosting(jobPostingId);

  if (!jobPosting) {
    notFound();
  }

  const draftAvailability = getDraftAvailability(jobPosting);

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
            <ApplicationDraftForm
              jobPostingId={jobPosting.id}
              canSave={draftAvailability.canSave}
              helperText={draftAvailability.reason}
            />
          }
        />
      </main>
    </div>
  );
}
