import Link from "next/link";

import type { JobPostingSummary } from "@/entities/recruitment/model";
import { getJobPostings } from "@/shared/api/recruitment";
import {
  formatRecruitmentPeriod,
  getRecruitmentCategoryLabel,
  getRecruitmentModeLabel,
  groupJobPostings,
  isJobPostingOpenForApplications,
} from "@/shared/lib/recruitment";

function AdminJobPostingSection({
  title,
  description,
  jobPostings,
  emptyMessage,
}: {
  title: string;
  description: string;
  jobPostings: JobPostingSummary[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {description}
          </p>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
          {jobPostings.length}嫄?
        </span>
      </div>

      {jobPostings.length === 0 ? (
        <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-6 text-sm text-on-surface-variant">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-3">
          {jobPostings.map((jobPosting) => (
            <div
              key={jobPosting.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-sm border border-outline-variant bg-surface-container-low px-5 py-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-sm bg-background px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-on-surface">
                    {getRecruitmentCategoryLabel(jobPosting.recruitmentCategory)}
                  </span>
                  <span
                    className={`rounded-sm px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] ${
                      jobPosting.recruitmentMode === "ROLLING"
                        ? "bg-primary/10 text-primary"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {getRecruitmentModeLabel(jobPosting.recruitmentMode)}
                  </span>
                </div>
                <p className="font-headline text-lg font-medium tracking-[-0.03em] text-on-surface">
                  {jobPosting.title}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {jobPosting.headline}
                </p>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                  {jobPosting.location} 쨌 {jobPosting.employmentType} 쨌{" "}
                  {formatRecruitmentPeriod(jobPosting)} 쨌 {jobPosting.stepCount}?④퀎
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/job-postings/${jobPosting.id}`}
                  className="rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground"
                >
                  怨듦퀬 ?섏젙
                </Link>
                <Link
                  href={`/admin/job-postings/${jobPosting.id}/questions`}
                  className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
                >
                  吏덈Ц 愿由?
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AdminPage() {
  const jobPostings = await getJobPostings().catch(() => []);
  const openJobPostings = jobPostings.filter(isJobPostingOpenForApplications);
  const groupedJobPostings = groupJobPostings(openJobPostings);

  return (
    <div className="space-y-8">
      <section className="rounded-sm border border-outline-variant bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              ??쒕낫??
            </p>
            <h1 className="mt-3 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
              ?꾩옱 梨꾩슜 ?댁쁺 ?꾪솴
            </h1>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              ?좎엯 梨꾩슜, 寃쎈젰 梨꾩슜, ?곸떆 梨꾩슜??遺꾨━?댁꽌 ?꾩옱 怨듦퀬瑜?愿由ы빀?덈떎.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/job-postings/new"
              className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
            >
              怨듦퀬 ?깅줉
            </Link>
            <Link
              href="/admin/applicants"
              className="rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground"
            >
              吏?먯옄 蹂닿린
            </Link>
            <Link
              href="/"
              className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
            >
              怨듦컻 ?ъ씠??
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              ?꾩껜 怨듦퀬
            </p>
            <p className="mt-3 font-headline text-4xl font-light tracking-[-0.06em] text-on-surface">
              {jobPostings.length}
            </p>
          </div>
          <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              ?꾩옱 紐⑥쭛 以?
            </p>
            <p className="mt-3 font-headline text-4xl font-light tracking-[-0.06em] text-primary">
              {openJobPostings.length}
            </p>
          </div>
          <div className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              ?곸떆 梨꾩슜
            </p>
            <p className="mt-3 font-headline text-4xl font-light tracking-[-0.06em] text-on-surface">
              {groupedJobPostings.rolling.length}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-outline-variant bg-card p-8">
        <div className="space-y-10">
          <AdminJobPostingSection
            title="?좎엯 梨꾩슜"
            description="議몄뾽 ?덉젙?먯? 珥덇린 而ㅻ━??吏?먯옄瑜??꾪븳 怨듦퀬?낅땲??"
            jobPostings={groupedJobPostings.newGrad}
            emptyMessage="?꾩옱 吏꾪뻾 以묒씤 ?좎엯 梨꾩슜 怨듦퀬媛 ?놁뒿?덈떎."
          />
          <AdminJobPostingSection
            title="寃쎈젰 梨꾩슜"
            description="利됱떆 ?꾨젰?붽? 媛?ν븳 寃쎈젰 ?ъ??섏엯?덈떎."
            jobPostings={groupedJobPostings.experienced}
            emptyMessage="?꾩옱 吏꾪뻾 以묒씤 寃쎈젰 梨꾩슜 怨듦퀬媛 ?놁뒿?덈떎."
          />
          <AdminJobPostingSection
            title="?곸떆 梨꾩슜"
            description="湲곌컙 ?쒗븳 ?놁씠 吏?먯쓣 諛쏄퀬 ?쒖감?곸쑝濡?寃?좏븯??怨듦퀬?낅땲??"
            jobPostings={groupedJobPostings.rolling}
            emptyMessage="?꾩옱 吏꾪뻾 以묒씤 ?곸떆 梨꾩슜 怨듦퀬媛 ?놁뒿?덈떎."
          />
        </div>
      </section>
    </div>
  );
}

