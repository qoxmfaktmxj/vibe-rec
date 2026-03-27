import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminApplicant } from "@/shared/api/admin-applicants";
import { getAdminAttachments } from "@/shared/api/attachments";
import {
  formatDateTime,
  formatFileSize,
  getApplicationReviewStatusClassName,
  getApplicationReviewStatusLabel,
  getApplicationStatusClassName,
  getApplicationStatusLabel,
  getFinalStatusClassName,
  getFinalStatusLabel,
} from "@/shared/lib/recruitment";

export default async function AdminApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-outline-variant/70 bg-card px-7 py-7">
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
              {applicant.finalStatus ? (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getFinalStatusClassName(applicant.finalStatus)}`}
                >
                  {getFinalStatusLabel(applicant.finalStatus)}
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-semibold tracking-[-0.06em] text-on-surface">
                {applicant.applicantName}
              </h1>
              <p className="text-sm text-on-surface-variant">
                {[applicant.applicantEmail, applicant.applicantPhone].filter(Boolean).join(" / ")}
              </p>
              <p className="text-sm font-medium text-on-surface">
                {applicant.jobPostingTitle}
              </p>
            </div>
          </div>

          <Link
            href="/admin/applicants"
            className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            지원자 목록으로
          </Link>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-4">
          <SummaryCard label="임시 저장일" value={formatDateTime(applicant.draftSavedAt)} />
          <SummaryCard label="제출일" value={formatDateTime(applicant.submittedAt)} />
          <SummaryCard label="검토일" value={formatDateTime(applicant.reviewedAt)} />
          <SummaryCard
            label="최종 결과"
            value={applicant.finalStatus ? getFinalStatusLabel(applicant.finalStatus) : "대기"}
          />
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-8">
          <Panel title="지원 메모" eyebrow="요약">
            <dl className="grid gap-4 md:grid-cols-2">
              <InfoRow label="지원 ID" value={String(applicant.applicationId)} />
              <InfoRow label="공고 키" value={applicant.jobPostingPublicKey} />
              <InfoRow label="검토 메모" value={applicant.reviewNote ?? "-"} />
              <InfoRow label="최종 메모" value={applicant.finalNote ?? "-"} />
            </dl>
          </Panel>

          <Panel title="이력서 상세" eyebrow="이력서">
            <div className="space-y-6">
              <ResumeList title="학력" items={applicant.educations.map((education) => ({
                id: education.id ?? `${education.institution}-${education.sortOrder}`,
                title: education.institution,
                subtitle: [education.degree, education.fieldOfStudy].filter(Boolean).join(" / "),
                meta: [education.startDate, education.endDate].filter(Boolean).join(" - "),
                description: education.description,
              }))} />
              <ResumeList title="경력" items={applicant.experiences.map((experience) => ({
                id: experience.id ?? `${experience.company}-${experience.sortOrder}`,
                title: experience.company,
                subtitle: experience.position,
                meta: [experience.startDate, experience.endDate].filter(Boolean).join(" - "),
                description: experience.description,
              }))} />
              <ResumeTagList title="기술 스택" items={applicant.skills.map((skill) => `${skill.skillName}${skill.proficiency ? ` / ${skill.proficiency}` : ""}${skill.years ? ` / ${skill.years}y` : ""}`)} />
              <ResumeList title="자격증" items={applicant.certifications.map((certification) => ({
                id: certification.id ?? `${certification.certificationName}-${certification.sortOrder}`,
                title: certification.certificationName,
                subtitle: certification.issuer,
                meta: certification.issuedDate ?? "",
                description: certification.expiryDate ? `만료: ${certification.expiryDate}` : "",
              }))} />
              <ResumeList title="언어" items={applicant.languages.map((language) => ({
                id: language.id ?? `${language.languageName}-${language.sortOrder}`,
                title: language.languageName,
                subtitle: language.proficiency,
                meta: language.testName,
                description: language.testScore,
              }))} />
            </div>
          </Panel>

          <Panel title="원본 데이터" eyebrow="디버그">
            <pre className="max-h-[420px] overflow-auto rounded-2xl bg-[#1e2022] p-5 text-xs leading-6 text-[#e1e3e4]">
              {JSON.stringify(applicant.resumePayload, null, 2)}
            </pre>
          </Panel>
        </div>

        <aside className="space-y-8 xl:sticky xl:top-8 xl:self-start">
          <Panel title="첨부파일" eyebrow="파일">
            {attachments.length === 0 ? (
              <p className="text-sm text-on-surface-variant">업로드된 첨부파일이 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {attachments.map((attachment) => (
                  <li key={attachment.id} className="rounded-2xl border border-outline-variant/70 bg-surface-container-low px-4 py-3">
                    <p className="truncate text-sm font-medium text-on-surface">{attachment.originalFilename}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {formatFileSize(attachment.fileSizeBytes)} / {formatDateTime(attachment.uploadedAt)}
                    </p>
                    <a
                      href={`/api/admin/attachments/${attachment.id}/download`}
                      className="mt-3 inline-flex rounded-sm border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface"
                    >
                      다운로드
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">{eyebrow}</p>
      <h2 className="mt-2 font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
      <p className="mt-3 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm text-on-surface">{value}</p>
    </div>
  );
}

function ResumeList({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string | number; title: string; subtitle?: string; meta?: string; description?: string }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-outline-variant/70 bg-surface-container-low p-4 text-sm">
            <p className="font-semibold text-on-surface">{item.title}</p>
            {item.subtitle ? <p className="text-on-surface-variant">{item.subtitle}</p> : null}
            {item.meta ? <p className="mt-1 text-xs text-outline">{item.meta}</p> : null}
            {item.description ? <p className="mt-2 whitespace-pre-line text-xs leading-6 text-on-surface-variant">{item.description}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumeTagList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
