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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_36%),linear-gradient(180deg,_#fcfbf7_0%,_#f3efe5_48%,_#ebe5d8_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-white"
          >
            Back to list
          </Link>
          <p className="text-sm text-stone-500">
            MVP flow: detail read - input validation - draft save
          </p>
        </div>

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
      </div>
    </main>
  );
}
