import Link from "next/link";

import { getJobPostings } from "@/shared/api/recruitment";
import { getJobPostingStatusLabel } from "@/shared/lib/recruitment";

export default async function AdminPage() {
  const jobPostings = await getJobPostings();
  const openJobPostingCount = jobPostings.filter(
    (jobPosting) => jobPosting.status === "OPEN",
  ).length;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ambient-shadow rounded-xl bg-surface-container-lowest p-6">
          <p className="text-sm font-semibold text-on-surface-variant">
            Total Postings
          </p>
          <p className="mt-2 font-headline text-4xl font-bold text-primary">
            {jobPostings.length}
          </p>
        </div>
        <div className="ambient-shadow rounded-xl bg-surface-container-lowest p-6">
          <p className="text-sm font-semibold text-on-surface-variant">
            Open Positions
          </p>
          <p className="mt-2 font-headline text-4xl font-bold text-secondary">
            {openJobPostingCount}
          </p>
        </div>
        <div className="ambient-shadow rounded-xl bg-surface-container-lowest p-6 sm:col-span-2">
          <p className="text-sm font-semibold text-on-surface-variant">
            Quick Actions
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/applicants"
              className="rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
            >
              Manage Applicants
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
            >
              View Public Site
            </Link>
          </div>
        </div>
      </div>

      {/* Progress & Snapshot */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <h2 className="font-headline text-2xl font-bold text-on-surface">
            Migration Progress
          </h2>
          <div className="mt-6 space-y-3 text-sm leading-7 text-on-surface-variant">
            <p className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-xs text-secondary">
                &#10003;
              </span>
              Foundation bootstrap, job posting read side, draft save
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-xs text-secondary">
                &#10003;
              </span>
              Admin session login, protected admin shell
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-xs text-secondary">
                &#10003;
              </span>
              Submit flow and application status rules
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-xs text-secondary">
                &#10003;
              </span>
              Applicant management and recruiter review
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-high text-xs text-outline">
                &rarr;
              </span>
              File upload, normalized resume, interview workflows
            </p>
          </div>
        </section>

        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <h2 className="font-headline text-2xl font-bold text-on-surface">
            Posting Snapshot
          </h2>
          <div className="mt-6 space-y-4">
            {jobPostings.map((jobPosting) => (
              <div
                key={jobPosting.id}
                className="rounded-lg bg-surface-container-low px-5 py-4"
              >
                <p className="font-headline font-bold text-on-surface">
                  {jobPosting.title}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {getJobPostingStatusLabel(jobPosting.status)} &bull;{" "}
                  {jobPosting.stepCount} steps
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
