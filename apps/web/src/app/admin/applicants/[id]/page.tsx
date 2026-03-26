import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { InterviewResponse } from "@/entities/recruitment/model";
import { ApplicantAttachmentList } from "@/features/admin/applicants/ApplicantAttachmentList";
import { ApplicantReviewForm } from "@/features/admin/applicants/ApplicantReviewForm";
import { HiringDecisionSection } from "@/features/admin/hiring/HiringDecisionSection";
import { InterviewSection } from "@/features/admin/interview/InterviewSection";
import { NotificationSection } from "@/features/admin/notification/NotificationSection";
import { getAdminApplicant } from "@/shared/api/admin-applicants";
import { getAdminJobPostingSteps } from "@/shared/api/admin-job-postings";
import { getNotifications as getAdminNotifications } from "@/shared/api/admin-hiring";
import { getAdminAttachments } from "@/shared/api/attachments";
import { getAdminInterviews } from "@/shared/api/admin-interviews";
import {
  formatDateTime,
  getApplicationReviewStatusClassName,
  getApplicationReviewStatusLabel,
  getApplicationStatusClassName,
  getApplicationStatusLabel,
  getFinalStatusClassName,
  getFinalStatusLabel,
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

  const [applicant, attachments] = await Promise.all([
    getAdminApplicant(applicationId),
    getAdminAttachments(applicationId).catch(() => []),
  ]);

  if (!applicant) {
    notFound();
  }

  const [interviews, notifications, steps] = await Promise.all([
    getAdminInterviews(applicationId).catch(() => [] as InterviewResponse[]),
    getAdminNotifications(applicationId).catch(() => []),
    getAdminJobPostingSteps(applicant.jobPostingId).catch(() => []),
  ]);

  const finalOutcomeLabel = applicant.finalStatus
    ? getFinalStatusLabel(applicant.finalStatus)
    : "誘몄젙";
  const narrativeItems = [
    applicant.introduction
      ? { label: "?먭린?뚭컻", value: applicant.introduction }
      : null,
    applicant.coreStrength
      ? { label: "?듭떖 媛뺤젏", value: applicant.coreStrength }
      : null,
    applicant.careerYears !== null
      ? { label: "寃쎈젰 ?곗감", value: `${applicant.careerYears}?? }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  const timelineMetrics = [
    {
      label: "泥⑤? ?뚯씪",
      value: attachments.length,
      helper: "吏?먯옄媛 ?쒖텧???뚯씪 ??,
    },
    {
      label: "硫댁젒",
      value: interviews.length,
      helper: "?덉젙 ?먮뒗 ?꾨즺??硫댁젒",
    },
    {
      label: "?뚮┝ 湲곕줉",
      value: notifications.length,
      helper: "湲곕줉??而ㅻ??덉??댁뀡 ??,
    },
    {
      label: "理쒖쥌 寃곌낵",
      value: finalOutcomeLabel,
      helper: applicant.finalDecidedAt
        ? `????쒓컖 ${formatDateTime(applicant.finalDecidedAt)}`
        : "?꾩쭅 寃곗젙?섏? ?딆븯?듬땲??,
    },
  ];

  const hasStructuredProfile =
    applicant.educations.length > 0 ||
    applicant.experiences.length > 0 ||
    applicant.skills.length > 0 ||
    applicant.certifications.length > 0 ||
    applicant.languages.length > 0;

  return (
    <div className="space-y-8">
      <section className="ambient-shadow rounded-[32px] border border-outline-variant/70 bg-card px-7 py-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
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
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                {applicant.jobPostingPublicKey}
              </span>
              {applicant.finalStatus ? (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getFinalStatusClassName(applicant.finalStatus)}`}
                >
                  {finalOutcomeLabel}
                </span>
              ) : null}
            </div>

            <div className="space-y-3">
              <h1 className="font-headline text-4xl font-semibold tracking-[-0.06em] text-on-surface">
                {applicant.applicantName}
              </h1>
              <p className="text-sm leading-7 text-on-surface-variant">
                {[applicant.applicantEmail, applicant.applicantPhone]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
              <p className="text-sm font-medium text-on-surface">
                {applicant.jobPostingTitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/applicants"
              className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              吏?먯옄 紐⑸줉?쇰줈
            </Link>
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-4">
          <SummaryCard
            label="?꾩떆 ???
            value={formatDateTime(applicant.draftSavedAt)}
          />
          <SummaryCard
            label="?쒖텧 ?꾨즺"
            value={formatDateTime(applicant.submittedAt)}
          />
          <SummaryCard
            label="理쒓렐 寃??
            value={formatDateTime(applicant.reviewedAt)}
          />
          <SummaryCard label="?꾩옱 理쒖쥌 ?곹깭" value={finalOutcomeLabel} />
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-8">
          <section className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                  吏?먯옄 ?붿빟
                </p>
                <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
                  ?ㅼ쓬 ?≪뀡 ?꾩뿉 ?듭떖 ?섏튂瑜??뺤씤?섏꽭??
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {timelineMetrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  helper={metric.helper}
                />
              ))}
            </div>
          </section>

          {narrativeItems.length > 0 ? (
            <section className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                  吏?먯옄 ?쒖닠???뺣낫
                </p>
                <h2 className="mt-2 font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
                  吏?먯꽌??吏곸젒 ?묒꽦???듭떖 ?댁슜
                </h2>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                {narrativeItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-outline-variant/70 bg-surface-container-low px-5 py-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                      {item.label}
                    </p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-on-surface">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <InterviewSection
            applicationId={applicationId}
            interviews={interviews}
            steps={steps}
          />

          <NotificationSection
            applicationId={applicationId}
            notifications={notifications}
          />

          <section className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                  泥⑤? ?뚯씪
                </p>
                <h2 className="mt-2 font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
                  ?쒖텧 ?뚯씪
                </h2>
              </div>
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {attachments.length}媛??뚯씪
              </span>
            </div>
            <div className="mt-6">
              <ApplicantAttachmentList attachments={attachments} />
            </div>
          </section>

          {hasStructuredProfile ? (
            <section className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                  援ъ“???대젰??
                </p>
                <h2 className="mt-2 font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
                  ?뺣━???대젰 ?뺣낫
                </h2>
              </div>

              <div className="mt-6 space-y-8">
                {applicant.educations.length > 0 ? (
                  <InfoListSection title="?숇젰">
                    {applicant.educations.map((education) => (
                      <InfoCard
                        key={education.id}
                        title={education.institution}
                        subtitle={[education.degree, education.fieldOfStudy]
                          .filter(Boolean)
                          .join(" / ")}
                        meta={
                          education.startDate || education.endDate
                            ? `${education.startDate ?? "誘몄긽"} - ${education.endDate ?? "?ы븰/議몄뾽 ?덉젙"}`
                            : undefined
                        }
                        description={education.description ?? undefined}
                      />
                    ))}
                  </InfoListSection>
                ) : null}

                {applicant.experiences.length > 0 ? (
                  <InfoListSection title="寃쎈젰">
                    {applicant.experiences.map((experience) => (
                      <InfoCard
                        key={experience.id}
                        title={experience.company}
                        subtitle={experience.position ?? undefined}
                        meta={
                          experience.startDate || experience.endDate
                            ? `${experience.startDate ?? "誘몄긽"} - ${experience.endDate ?? "?ъ쭅 以?}`
                            : undefined
                        }
                        description={experience.description ?? undefined}
                      />
                    ))}
                  </InfoListSection>
                ) : null}

                {applicant.skills.length > 0 ? (
                  <InfoListSection title="湲곗닠 諛???웾">
                    <div className="flex flex-wrap gap-2">
                      {applicant.skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                        >
                          {skill.skillName}
                          {skill.proficiency ? (
                            <span className="text-primary/60">
                              {" / "}
                              {skill.proficiency}
                            </span>
                          ) : null}
                          {skill.years ? (
                            <span className="text-primary/60">
                              {" / "}
                              {skill.years}??
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </InfoListSection>
                ) : null}

                {applicant.certifications.length > 0 ? (
                  <InfoListSection title="?먭꺽利?>
                    {applicant.certifications.map((certification) => (
                      <InfoCard
                        key={certification.id}
                        title={certification.certificationName}
                        subtitle={certification.issuer ?? undefined}
                        meta={
                          certification.issuedDate
                            ? `痍⑤뱷??${certification.issuedDate}`
                            : undefined
                        }
                      />
                    ))}
                  </InfoListSection>
                ) : null}

                {applicant.languages.length > 0 ? (
                  <InfoListSection title="?댄븰">
                    {applicant.languages.map((language) => (
                      <InfoCard
                        key={language.id}
                        title={language.languageName}
                        subtitle={language.proficiency ?? undefined}
                        meta={
                          language.testName
                            ? `${language.testName}${language.testScore ? `: ${language.testScore}` : ""}`
                            : undefined
                        }
                      />
                    ))}
                  </InfoListSection>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                  ?먮낯 payload
                </p>
                <h2 className="mt-2 font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
                  ?먮낯 吏???곗씠??
                </h2>
              </div>
            </div>

            <details className="mt-6 rounded-2xl border border-outline-variant/70 bg-surface-container-low px-5 py-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-on-surface marker:hidden">
                ?먮낯 payload 蹂닿린
              </summary>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                援ъ“?붾맂 ?뺣낫留뚯쑝濡?留λ씫??遺議깊븯嫄곕굹 ?먮낯 媛믪쓣 吏곸젒 ?뺤씤?댁빞 ??
                ???댁뼱 蹂댁꽭??
              </p>
              <pre className="mt-4 max-h-[420px] overflow-auto rounded-2xl bg-[#1e2022] p-5 text-xs leading-6 text-[#e1e3e4]">
                {JSON.stringify(applicant.resumePayload, null, 2)}
              </pre>
            </details>
          </section>
        </div>

        <aside className="space-y-8 xl:sticky xl:top-8 xl:self-start">
          <ApplicantReviewForm applicant={applicant} />

          <HiringDecisionSection
            applicationId={applicationId}
            currentFinalStatus={applicant.finalStatus}
            currentNote={applicant.finalNote}
            currentDecidedAt={applicant.finalDecidedAt}
            reviewStatus={applicant.reviewStatus}
          />
        </aside>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-3 font-headline text-3xl font-semibold tracking-[-0.05em] text-on-surface">
        {value}
      </p>
      <p className="mt-2 text-sm text-on-surface-variant">{helper}</p>
    </div>
  );
}

function InfoListSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
        {title}
      </h3>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function InfoCard({
  title,
  subtitle,
  meta,
  description,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low p-4 text-sm">
      <p className="font-semibold text-on-surface">{title}</p>
      {subtitle ? <p className="text-on-surface-variant">{subtitle}</p> : null}
      {meta ? <p className="mt-1 text-xs text-outline">{meta}</p> : null}
      {description ? (
        <p className="mt-2 whitespace-pre-line text-xs leading-6 text-on-surface-variant">
          {description}
        </p>
      ) : null}
    </div>
  );
}

