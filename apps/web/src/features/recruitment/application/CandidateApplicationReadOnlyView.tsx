import Link from "next/link";

import type { AttachmentSummary } from "@/entities/recruitment/attachment-model";
import type {
  CandidateApplicationDetail,
  CandidateApplicationSummary,
  JobPostingQuestion,
} from "@/entities/recruitment/model";
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  getApplicationReviewStatusClassName,
  getApplicationReviewStatusLabel,
  getApplicationStatusClassName,
  getApplicationStatusLabel,
  getDegreeLabel,
  getEmploymentTypeLabel,
  getFinalStatusClassName,
  getFinalStatusLabel,
} from "@/shared/lib/recruitment";

interface CandidateApplicationReadOnlyViewProps {
  application: CandidateApplicationDetail;
  summary: CandidateApplicationSummary;
  questions: JobPostingQuestion[];
  attachments: AttachmentSummary[];
}

function readResumeText(
  payload: Record<string, unknown>,
  key: string,
  fallback: string | null = null,
) {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function readResumeNumber(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getAnswerText(
  application: CandidateApplicationDetail,
  question: JobPostingQuestion,
) {
  const answer = application.answers.find(
    (item) => item.questionId === question.id,
  );

  if (!answer) {
    return "답변 없음";
  }

  if (answer.answerText) {
    return answer.answerText;
  }

  if (answer.answerChoice) {
    return answer.answerChoice;
  }

  if (answer.answerScale != null) {
    return `${answer.answerScale}점`;
  }

  return "답변 없음";
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
        {eyebrow}
      </p>
      <div className="space-y-1">
        <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-7 text-on-surface-variant">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CandidateApplicationReadOnlyView({
  application,
  summary,
  questions,
  attachments,
}: CandidateApplicationReadOnlyViewProps) {
  const introduction = readResumeText(application.resumePayload, "introduction");
  const coreStrength = readResumeText(application.resumePayload, "coreStrength");
  const motivationFit =
    application.motivationFit ??
    readResumeText(application.resumePayload, "motivationFit");
  const careerYears = readResumeNumber(application.resumePayload, "careerYears");

  return (
    <div className="space-y-6">
      <section className="rounded-sm border border-outline-variant bg-card p-7 shadow-[0_16px_40px_-28px_rgba(31,41,55,0.25)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              지원서 상세
            </p>
            <div className="space-y-2">
              <h1 className="font-headline text-3xl font-medium tracking-[-0.05em] text-on-surface">
                {summary.jobPostingTitle}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                {summary.jobPostingHeadline}
              </p>
              <p className="text-sm text-on-surface-variant">
                {summary.location} · {getEmploymentTypeLabel(summary.employmentType)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getApplicationStatusClassName(
                application.status,
              )}`}
            >
              {getApplicationStatusLabel(application.status)}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getApplicationReviewStatusClassName(
                application.reviewStatus,
              )}`}
            >
              {getApplicationReviewStatusLabel(application.reviewStatus)}
            </span>
            {application.finalStatus ? (
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getFinalStatusClassName(
                  application.finalStatus,
                )}`}
              >
                {getFinalStatusLabel(application.finalStatus)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-sm bg-surface-container-low px-4 py-4">
            <p className="text-xs text-on-surface-variant">임시 저장</p>
            <p className="mt-2 text-sm font-medium text-on-surface">
              {formatDateTime(application.draftSavedAt)}
            </p>
          </div>
          <div className="rounded-sm bg-surface-container-low px-4 py-4">
            <p className="text-xs text-on-surface-variant">제출 시각</p>
            <p className="mt-2 text-sm font-medium text-on-surface">
              {formatDateTime(application.submittedAt)}
            </p>
          </div>
          <div className="rounded-sm bg-surface-container-low px-4 py-4">
            <p className="text-xs text-on-surface-variant">검토 갱신</p>
            <p className="mt-2 text-sm font-medium text-on-surface">
              {formatDateTime(application.reviewedAt)}
            </p>
          </div>
          <div className="rounded-sm bg-surface-container-low px-4 py-4">
            <p className="text-xs text-on-surface-variant">최종 결정</p>
            <p className="mt-2 text-sm font-medium text-on-surface">
              {formatDateTime(application.finalDecidedAt)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/job-postings/${summary.jobPostingId}`}
            className="rounded-sm border border-outline-variant px-5 py-3 text-xs font-medium tracking-[0.08em] text-on-surface transition-colors hover:border-primary hover:text-primary"
          >
            원문 공고 보기
          </Link>
          <Link
            href="/job-postings"
            className="rounded-sm bg-primary px-5 py-3 text-xs font-medium tracking-[0.08em] text-primary-foreground transition-colors hover:bg-[#7a2451]"
          >
            다른 공고 보기
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-sm border border-outline-variant bg-card p-7">
            <SectionTitle
              eyebrow="지원자"
              title="기본 정보"
              description="제출 당시 계정 기준으로 저장된 지원자 정보입니다."
            />
            <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="text-on-surface-variant">이름</dt>
                <dd className="mt-1 font-medium text-on-surface">
                  {application.applicantName}
                </dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">이메일</dt>
                <dd className="mt-1 font-medium text-on-surface">
                  {application.applicantEmail}
                </dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">연락처</dt>
                <dd className="mt-1 font-medium text-on-surface">
                  {application.applicantPhone}
                </dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">경력 연차</dt>
                <dd className="mt-1 font-medium text-on-surface">
                  {careerYears != null ? `${careerYears}년` : "미입력"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-sm border border-outline-variant bg-card p-7">
            <SectionTitle eyebrow="지원 동기" title="지원 소개와 자기소개" />
            <div className="mt-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-on-surface">
                  이 공고에 지원한 이유
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-on-surface-variant">
                  {motivationFit ?? "입력한 내용이 없습니다."}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">
                  자기소개
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-on-surface-variant">
                  {introduction ?? "입력한 내용이 없습니다."}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">
                  핵심 강점
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-on-surface-variant">
                  {coreStrength ?? "입력한 내용이 없습니다."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-outline-variant bg-card p-7">
            <SectionTitle eyebrow="이력" title="학력과 경력" />
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-on-surface">학력</h3>
                {application.educations.length === 0 ? (
                  <p className="mt-2 text-sm text-on-surface-variant">
                    등록된 학력 정보가 없습니다.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {application.educations.map((education, index) => (
                      <div
                        key={`education-${education.id ?? index}`}
                        className="rounded-sm bg-surface-container-low px-4 py-4"
                      >
                        <p className="font-medium text-on-surface">
                          {education.institution}
                        </p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {education.fieldOfStudy || "전공 미입력"} ·{" "}
                          {education.degree
                            ? getDegreeLabel(education.degree)
                            : "학위 미입력"}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {formatDate(education.startDate)} -{" "}
                          {formatDate(education.endDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-on-surface">경력</h3>
                {application.experiences.length === 0 ? (
                  <p className="mt-2 text-sm text-on-surface-variant">
                    등록된 경력 정보가 없습니다.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {application.experiences.map((experience, index) => (
                      <div
                        key={`experience-${experience.id ?? index}`}
                        className="rounded-sm bg-surface-container-low px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-on-surface">
                              {experience.company}
                            </p>
                            <p className="mt-1 text-sm text-on-surface-variant">
                              {experience.position || "직무 미입력"}
                            </p>
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            {formatDate(experience.startDate)} -{" "}
                            {formatDate(experience.endDate)}
                          </p>
                        </div>
                        {experience.description ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-on-surface-variant">
                            {experience.description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-outline-variant bg-card p-7">
            <SectionTitle eyebrow="공고 질문" title="제출한 답변" />
            {questions.length === 0 ? (
              <p className="mt-6 text-sm text-on-surface-variant">
                이 공고에는 별도 질문이 없습니다.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-sm bg-surface-container-low px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                      질문 {index + 1}
                    </p>
                    <h3 className="mt-2 text-sm font-semibold text-on-surface">
                      {question.questionText}
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-on-surface-variant">
                      {getAnswerText(application, question)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-sm border border-outline-variant bg-card p-7">
            <SectionTitle eyebrow="기술 정보" title="보유 역량" />
            <div className="mt-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-on-surface">스킬</h3>
                {application.skills.length === 0 ? (
                  <p className="mt-2 text-sm text-on-surface-variant">
                    등록된 스킬이 없습니다.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {application.skills.map((skill, index) => (
                      <span
                        key={`skill-${skill.id ?? index}`}
                        className="rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface"
                      >
                        {skill.skillName}
                        {skill.years != null ? ` · ${skill.years}년` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-on-surface">
                  자격증
                </h3>
                {application.certifications.length === 0 ? (
                  <p className="mt-2 text-sm text-on-surface-variant">
                    등록된 자격증이 없습니다.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {application.certifications.map((certification, index) => (
                      <div
                        key={`cert-${certification.id ?? index}`}
                        className="rounded-sm bg-surface-container-low px-4 py-3"
                      >
                        <p className="text-sm font-medium text-on-surface">
                          {certification.certificationName}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {certification.issuer || "발급기관 미입력"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-on-surface">언어</h3>
                {application.languages.length === 0 ? (
                  <p className="mt-2 text-sm text-on-surface-variant">
                    등록된 언어 정보가 없습니다.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {application.languages.map((language, index) => (
                      <div
                        key={`language-${language.id ?? index}`}
                        className="rounded-sm bg-surface-container-low px-4 py-3"
                      >
                        <p className="text-sm font-medium text-on-surface">
                          {language.languageName}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {language.proficiency || "수준 미입력"}
                          {language.testName ? ` · ${language.testName}` : ""}
                          {language.testScore ? ` (${language.testScore})` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-outline-variant bg-card p-7">
            <SectionTitle eyebrow="첨부 파일" title="제출 자료" />
            {attachments.length === 0 ? (
              <p className="mt-6 text-sm text-on-surface-variant">
                첨부한 파일이 없습니다.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={`/api/attachments/${attachment.id}/download`}
                    className="block rounded-sm border border-outline-variant px-4 py-3 transition-colors hover:border-primary hover:bg-surface-container-low"
                  >
                    <p className="truncate text-sm font-medium text-on-surface">
                      {attachment.originalFilename}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {formatFileSize(attachment.fileSizeBytes)} ·{" "}
                      {formatDateTime(attachment.uploadedAt)}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
