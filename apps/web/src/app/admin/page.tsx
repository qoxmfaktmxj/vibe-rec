import Link from "next/link";

import { getJobPostings } from "@/shared/api/recruitment";
import { getJobPostingStatusLabel } from "@/shared/lib/recruitment";

export default async function AdminPage() {
  const jobPostings = await getJobPostings();
  const openJobPostingCount = jobPostings.filter(
    (jobPosting) => jobPosting.status === "OPEN",
  ).length;

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="rounded-[2rem] border border-black/8 bg-white/82 p-7 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
        <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
          Phase Progress
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
          Current migration slice
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] bg-stone-950 px-5 py-5 text-stone-50">
            <p className="text-sm text-stone-400">Published postings</p>
            <p className="mt-2 text-4xl font-semibold">{jobPostings.length}</p>
          </div>
          <div className="rounded-[1.5rem] bg-[#d8efe7] px-5 py-5 text-stone-900">
            <p className="text-sm text-teal-900/70">Open postings</p>
            <p className="mt-2 text-4xl font-semibold">{openJobPostingCount}</p>
          </div>
        </div>
        <div className="mt-6 space-y-3 text-sm leading-7 text-stone-700">
          <p>Done: foundation bootstrap, job posting read side, draft save.</p>
          <p>Done: admin session login, protected admin shell.</p>
          <p>Done: final submit flow and stricter application status rules.</p>
          <p>Done: applicant management list, detail, and recruiter review status.</p>
          <p>Next: file upload, normalized resume expansion, and interview workflows.</p>
        </div>
        <Link
          href="/admin/applicants"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          지원자 관리 열기
        </Link>
      </article>

      <aside className="rounded-[2rem] border border-black/8 bg-white/82 p-7 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
        <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
          Posting Snapshot
        </p>
        <div className="mt-5 space-y-4">
          {jobPostings.map((jobPosting) => (
            <div
              key={jobPosting.id}
              className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4"
            >
              <p className="text-base font-semibold text-stone-950">
                {jobPosting.title}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {getJobPostingStatusLabel(jobPosting.status)} ·{" "}
                {jobPosting.stepCount} steps
              </p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
