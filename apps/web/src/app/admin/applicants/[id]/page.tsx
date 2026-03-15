import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicantReviewForm } from "@/features/admin/applicants/ApplicantReviewForm";
import { getAdminApplicant } from "@/shared/api/admin-applicants";
import {
  formatDateTime,
  getApplicationReviewStatusClassName,
  getApplicationReviewStatusLabel,
  getApplicationStatusClassName,
  getApplicationStatusLabel,
} from "@/shared/lib/recruitment";

interface AdminApplicantDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminApplicantDetailPage({
  params,
}: AdminApplicantDetailPageProps) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    notFound();
  }

  const applicant = await getAdminApplicant(applicationId);

  if (!applicant) {
    notFound();
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <article className="rounded-[2rem] border border-black/8 bg-white/84 p-8 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getApplicationStatusClassName(applicant.applicationStatus)}`}
            >
              {getApplicationStatusLabel(applicant.applicationStatus)}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getApplicationReviewStatusClassName(applicant.reviewStatus)}`}
            >
              {getApplicationReviewStatusLabel(applicant.reviewStatus)}
            </span>
            <span className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
              {applicant.jobPostingPublicKey}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-stone-950">
              {applicant.applicantName}
            </h1>
            <p className="text-sm leading-7 text-stone-600">
              {applicant.applicantEmail} · {applicant.applicantPhone}
            </p>
            <p className="text-sm text-stone-500">
              지원 공고: {applicant.jobPostingTitle}
            </p>
          </div>

          <dl className="mt-8 grid gap-4 rounded-[1.75rem] bg-stone-950 px-5 py-5 text-sm text-stone-100 md:grid-cols-3">
            <div>
              <dt className="text-stone-400">Draft 저장</dt>
              <dd className="mt-1 font-medium">
                {formatDateTime(applicant.draftSavedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-stone-400">최종 제출</dt>
              <dd className="mt-1 font-medium">
                {formatDateTime(applicant.submittedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-stone-400">마지막 검토</dt>
              <dd className="mt-1 font-medium">
                {formatDateTime(applicant.reviewedAt)}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[2rem] border border-black/8 bg-white/84 p-8 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
                Resume Payload
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                원본 지원 데이터
              </h2>
            </div>
            <Link
              href="/admin/applicants"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              목록으로
            </Link>
          </div>

          <pre className="mt-6 overflow-x-auto rounded-[1.5rem] bg-stone-950 p-5 text-xs leading-6 text-stone-100">
            {JSON.stringify(applicant.resumePayload, null, 2)}
          </pre>
        </article>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
        <ApplicantReviewForm applicant={applicant} />

        <article className="rounded-[2rem] border border-black/8 bg-white/84 p-7 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
          <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
            Review Note
          </p>
          <h2 className="mt-3 text-xl font-semibold text-stone-950">
            현재 메모
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-stone-700">
            {applicant.reviewNote ?? "아직 저장된 검토 메모가 없다."}
          </p>
        </article>
      </aside>
    </section>
  );
}
