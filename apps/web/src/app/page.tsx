import { JobPostingList } from "@/features/recruitment/job-postings/JobPostingList";
import { getJobPostings } from "@/shared/api/recruitment";
import { getJobPostingStatusLabel } from "@/shared/lib/recruitment";

export default async function Home() {
  const jobPostings = await getJobPostings();
  const openJobPostingCount = jobPostings.filter(
    (jobPosting) => jobPosting.status === "OPEN",
  ).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_36%),linear-gradient(180deg,_#fcfbf7_0%,_#f3efe5_48%,_#ebe5d8_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="rounded-[2.25rem] border border-black/8 bg-white/82 p-8 shadow-[0_24px_80px_rgba(43,35,18,0.08)] backdrop-blur">
            <div className="inline-flex rounded-full bg-teal-950 px-4 py-1.5 font-mono text-xs tracking-[0.24em] text-teal-50 uppercase">
              Recruitment MVP
            </div>
            <div className="mt-6 space-y-5">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-stone-950 md:text-6xl">
                PostgreSQL-first recruitment MVP
              </h1>
              <p className="max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
                This slice covers job posting list, posting detail, and
                application draft save. Reads run in Server Components and the
                save flow uses a Server Action that calls the Spring Boot API.
              </p>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[2rem] border border-black/8 bg-stone-950 p-6 text-stone-50 shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
              <p className="font-mono text-xs tracking-[0.24em] text-teal-300 uppercase">
                Current Slice
              </p>
              <dl className="mt-5 grid gap-4">
                <div>
                  <dt className="text-sm text-stone-400">Job postings</dt>
                  <dd className="text-3xl font-semibold">{jobPostings.length}</dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-400">Open postings</dt>
                  <dd className="text-3xl font-semibold">
                    {openJobPostingCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-400">Validation scope</dt>
                  <dd className="text-sm leading-7 text-stone-200">
                    Listing, detail view, draft save, and save guard rules
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[2rem] border border-black/8 bg-[#d8efe7] p-6 text-stone-900 shadow-[0_18px_60px_rgba(45,95,85,0.14)]">
              <p className="font-mono text-xs tracking-[0.24em] uppercase text-teal-900/75">
                Status Snapshot
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-stone-700">
                {jobPostings.map((jobPosting) => (
                  <p key={jobPosting.id}>
                    {jobPosting.title}: {getJobPostingStatusLabel(jobPosting.status)}
                  </p>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
                Job Posting
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
                Job posting list
              </h2>
            </div>
            <p className="max-w-md text-right text-sm leading-7 text-stone-600">
              Move into the detail view to verify recruitment steps and the
              application draft save flow together.
            </p>
          </div>

          <JobPostingList jobPostings={jobPostings} />
        </section>
      </div>
    </main>
  );
}
