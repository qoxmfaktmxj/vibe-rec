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
      {/* Nav */}
      <nav className="glass-nav sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/15 px-8 py-4">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="font-headline text-2xl font-extrabold tracking-tight text-primary"
          >
            Vibe Rec
          </Link>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 font-medium text-on-surface-variant transition-colors hover:text-primary"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          목록으로
        </Link>
      </nav>

      <main className="mx-auto max-w-7xl px-8 py-10">
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
