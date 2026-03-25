import Link from "next/link";

import { getJobPostings } from "@/shared/api/recruitment";

export default async function AdminPage() {
  const jobPostings = await getJobPostings().catch(() => []);
  const openJobPostingCount = jobPostings.filter(
    (jobPosting) => jobPosting.status === "OPEN",
  ).length;

  return (
    <div className="space-y-8">
      <section className="rounded-sm border border-outline-variant bg-card p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
          대시보드
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              전체 공고
            </p>
            <p className="mt-3 font-headline text-4xl font-light tracking-[-0.06em] text-on-surface">
              {jobPostings.length}
            </p>
          </div>
          <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              모집 중
            </p>
            <p className="mt-3 font-headline text-4xl font-light tracking-[-0.06em] text-primary">
              {openJobPostingCount}
            </p>
          </div>
          <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              빠른 작업
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/admin/applicants"
                className="rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground"
              >
                지원자 보기
              </Link>
              <Link
                href="/"
                className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
              >
                공개 사이트
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-outline-variant bg-card p-8">
        <div className="flex items-end justify-between gap-6 border-b border-outline-variant pb-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              현황
            </p>
            <h2 className="mt-3 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
              현재 공고
            </h2>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          {jobPostings.map((jobPosting) => (
            <div
              key={jobPosting.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-outline-variant bg-surface-container-low px-5 py-4"
            >
              <div>
                <p className="font-headline text-lg font-medium tracking-[-0.03em] text-on-surface">
                  {jobPosting.title}
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                  {jobPosting.location} · 전형 {jobPosting.stepCount}단계
                </p>
              </div>
              <span className="rounded-sm bg-primary-container px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-primary">
                {jobPosting.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
