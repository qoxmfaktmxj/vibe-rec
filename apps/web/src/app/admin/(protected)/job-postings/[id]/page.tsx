import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { JobPostingEditorForm } from "@/features/admin/job-postings/JobPostingEditorForm";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { getAdminJobPosting } from "@/shared/api/admin-job-postings";

interface AdminEditJobPostingPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditJobPostingPage({
  params,
}: AdminEditJobPostingPageProps) {
  const { id } = await params;
  const jobPostingId = Number(id);

  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0) {
    notFound();
  }

  const adminSession = await getCurrentAdminSession().catch(() => null);
  if (!adminSession) {
    redirect("/admin/login");
  }

  const jobPosting = await getAdminJobPosting(jobPostingId).catch(() => null);
  if (!jobPosting) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
            Job posting #{jobPostingId}
          </p>
          <h1 className="mt-2 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
            Edit job posting
          </h1>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            Update the category, recruitment mode, and publication schedule in one place.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/job-postings/${jobPostingId}/questions`}
            className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
          >
            Edit questions
          </Link>
          <Link
            href="/admin"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant transition-colors hover:text-primary"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      <JobPostingEditorForm
        mode="edit"
        jobPostingId={jobPostingId}
        initialValue={jobPosting}
      />
    </div>
  );
}
