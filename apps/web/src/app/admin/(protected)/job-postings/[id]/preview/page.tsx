import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminJobPostingPreview } from "@/shared/api/admin-job-postings";
import { formatDateTime, formatRecruitmentPeriod } from "@/shared/lib/recruitment";

export default async function AdminJobPostingPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const jobPostingId = Number((await params).id);
  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0) notFound();

  const preview = await getAdminJobPostingPreview(jobPostingId).catch(() => null);
  if (!preview) notFound();
  const { jobPosting, steps, questions } = preview;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
            관리자 전용 미리보기
          </p>
          <h1 className="mt-2 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
            {jobPosting.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-on-surface-variant">
            이 화면은 공개 여부와 예약 시각에 관계없이 저장된 공고 구성을 보여줍니다.
          </p>
        </div>
        <Link
          href={`/admin/job-postings/${jobPostingId}`}
          className="min-h-[44px] rounded-lg border border-primary/30 bg-card px-4 py-2.5 text-sm font-semibold text-primary focus:ring-2 focus:ring-primary/20"
        >
          편집으로 돌아가기
        </Link>
      </header>

      <section className="rounded-lg border border-outline-variant bg-card p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">
          {jobPosting.location} · {jobPosting.employmentType}
        </p>
        <h2 className="mt-4 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
          {jobPosting.headline}
        </h2>
        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-on-surface-variant">
          {jobPosting.description}
        </p>
        <dl className="mt-6 grid gap-4 border-t border-outline-variant pt-5 md:grid-cols-3">
          <PreviewFact label="공개 상태" value={jobPosting.publicationState} />
          <PreviewFact label="모집 기간" value={formatRecruitmentPeriod(jobPosting)} />
          <PreviewFact label="공개 시작" value={formatDateTime(jobPosting.opensAt)} />
        </dl>
      </section>

      <section className="rounded-lg border border-outline-variant bg-card p-8">
        <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
          채용 절차
        </h2>
        {steps.length === 0 ? (
          <p className="mt-4 text-sm text-on-surface-variant">등록된 채용 단계가 없습니다.</p>
        ) : (
          <ol className="mt-5 space-y-3">
            {steps.map((step) => (
              <li key={step.id ?? step.stepOrder} className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-primary">{step.stepOrder}</span>
                  <h3 className="font-semibold text-on-surface">{step.title}</h3>
                  <span className="ml-auto text-xs text-on-surface-variant">{step.stepType}</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">{step.description}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-lg border border-outline-variant bg-card p-8">
        <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
          지원 질문
        </h2>
        {questions.length === 0 ? (
          <p className="mt-4 text-sm text-on-surface-variant">등록된 추가 질문이 없습니다.</p>
        ) : (
          <ol className="mt-5 space-y-3">
            {questions.map((question, index) => (
              <li key={question.id} className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[11px] text-primary">Q{index + 1}</span>
                  <p className="font-semibold text-on-surface">{question.questionText}</p>
                  <span className="ml-auto text-xs text-on-surface-variant">
                    {question.questionType}{question.required ? " · 필수" : " · 선택"}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-on-surface">{value}</dd>
    </div>
  );
}
