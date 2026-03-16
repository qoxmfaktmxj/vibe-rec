import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicantAttachmentList } from "@/features/admin/applicants/ApplicantAttachmentList";
import { ApplicantReviewForm } from "@/features/admin/applicants/ApplicantReviewForm";
import { InterviewSection } from "@/features/admin/applicants/InterviewSection";
import { getAdminApplicant } from "@/shared/api/admin-applicants";
import { getAdminAttachments } from "@/shared/api/attachments";
import { getAdminInterviews } from "@/shared/api/admin-interviews";
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

  const [applicant, attachments, interviews] = await Promise.all([
    getAdminApplicant(applicationId),
    getAdminAttachments(applicationId).catch(() => []),
    getAdminInterviews(applicationId).catch(() => []),
  ]);

  if (!applicant) {
    notFound();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-8">
        {/* Applicant Info */}
        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
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
            <span className="text-xs font-medium uppercase tracking-widest text-outline">
              {applicant.jobPostingPublicKey}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <h1 className="font-headline text-3xl font-bold text-on-surface">
              {applicant.applicantName}
            </h1>
            <p className="text-sm leading-7 text-on-surface-variant">
              {applicant.applicantEmail} &bull; {applicant.applicantPhone}
            </p>
            <p className="text-sm text-outline">
              지원 공고: {applicant.jobPostingTitle}
            </p>
          </div>

          <div className="mt-8 grid gap-4 rounded-xl bg-surface-container-low px-6 py-5 text-sm md:grid-cols-3">
            <div>
              <dt className="font-semibold text-on-surface-variant">
                임시저장
              </dt>
              <dd className="mt-1 font-medium text-on-surface">
                {formatDateTime(applicant.draftSavedAt)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-on-surface-variant">
                최종 제출
              </dt>
              <dd className="mt-1 font-medium text-on-surface">
                {formatDateTime(applicant.submittedAt)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-on-surface-variant">
                마지막 검토
              </dt>
              <dd className="mt-1 font-medium text-on-surface">
                {formatDateTime(applicant.reviewedAt)}
              </dd>
            </div>
          </div>
        </section>

        {/* Attachments */}
        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <h2 className="mb-5 font-headline text-2xl font-bold text-on-surface">
            첨부파일
            <span className="ml-2 text-base font-normal text-outline">
              {attachments.length}개
            </span>
          </h2>
          <ApplicantAttachmentList attachments={attachments} />
        </section>

        {/* 정규화된 이력서 */}
        {(applicant.educations.length > 0 ||
          applicant.experiences.length > 0 ||
          applicant.skills.length > 0 ||
          applicant.certifications.length > 0 ||
          applicant.languages.length > 0) ? (
          <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8 space-y-6">
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              이력서 상세
            </h2>

            {applicant.educations.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-on-surface-variant mb-3">학력</h3>
                <div className="space-y-3">
                  {applicant.educations.map((edu) => (
                    <div key={edu.id} className="rounded-lg bg-surface-container-low p-4 text-sm">
                      <p className="font-semibold text-on-surface">{edu.institution}</p>
                      <p className="text-on-surface-variant">
                        {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" · ")}
                      </p>
                      {(edu.startDate ?? edu.endDate) ? (
                        <p className="text-xs text-outline mt-1">
                          {edu.startDate ?? "?"} ~ {edu.endDate ?? "재학 중"}
                        </p>
                      ) : null}
                      {edu.description ? (
                        <p className="mt-2 text-xs text-on-surface-variant whitespace-pre-line">{edu.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {applicant.experiences.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-on-surface-variant mb-3">경력</h3>
                <div className="space-y-3">
                  {applicant.experiences.map((exp) => (
                    <div key={exp.id} className="rounded-lg bg-surface-container-low p-4 text-sm">
                      <p className="font-semibold text-on-surface">{exp.company}</p>
                      {exp.position ? <p className="text-on-surface-variant">{exp.position}</p> : null}
                      {(exp.startDate ?? exp.endDate) ? (
                        <p className="text-xs text-outline mt-1">
                          {exp.startDate ?? "?"} ~ {exp.endDate ?? "재직 중"}
                        </p>
                      ) : null}
                      {exp.description ? (
                        <p className="mt-2 text-xs text-on-surface-variant whitespace-pre-line">{exp.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {applicant.skills.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-on-surface-variant mb-3">스킬</h3>
                <div className="flex flex-wrap gap-2">
                  {applicant.skills.map((skill) => (
                    <span key={skill.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                      {skill.skillName}
                      {skill.proficiency ? <span className="text-primary/60">· {skill.proficiency}</span> : null}
                      {skill.years ? <span className="text-primary/60">· {skill.years}년</span> : null}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {applicant.certifications.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-on-surface-variant mb-3">자격증</h3>
                <div className="space-y-2">
                  {applicant.certifications.map((cert) => (
                    <div key={cert.id} className="rounded-lg bg-surface-container-low p-4 text-sm">
                      <p className="font-semibold text-on-surface">{cert.certificationName}</p>
                      {cert.issuer ? <p className="text-on-surface-variant">{cert.issuer}</p> : null}
                      {cert.issuedDate ? <p className="text-xs text-outline mt-1">취득일: {cert.issuedDate}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {applicant.languages.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-on-surface-variant mb-3">어학</h3>
                <div className="space-y-2">
                  {applicant.languages.map((lang) => (
                    <div key={lang.id} className="rounded-lg bg-surface-container-low p-4 text-sm">
                      <p className="font-semibold text-on-surface">
                        {lang.languageName}
                        {lang.proficiency ? <span className="ml-2 font-normal text-on-surface-variant">({lang.proficiency})</span> : null}
                      </p>
                      {lang.testName ? (
                        <p className="text-xs text-outline mt-1">
                          {lang.testName}{lang.testScore ? `: ${lang.testScore}` : ""}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* 면접 일정 */}
        <InterviewSection
          applicationId={applicationId}
          interviews={interviews}
          canSchedule={applicant.reviewStatus === "PASSED"}
        />

        {/* Resume Payload (원문) */}
        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              지원서 원문
            </h2>
            <Link
              href="/admin/applicants"
              className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
            >
              목록으로
            </Link>
          </div>

          <pre className="mt-6 overflow-x-auto rounded-xl bg-[#1e2022] p-5 text-xs leading-6 text-[#e1e3e4]">
            {JSON.stringify(applicant.resumePayload, null, 2)}
          </pre>
        </section>
      </div>

      <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
        <ApplicantReviewForm applicant={applicant} />

        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-7">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            검토 메모
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-on-surface-variant">
            {applicant.reviewNote ?? "아직 저장된 검토 메모가 없습니다."}
          </p>
        </section>
      </aside>
    </div>
  );
}
