"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import type { CandidateSession } from "@/entities/candidate/model";
import type { AttachmentSummary } from "@/entities/recruitment/attachment-model";
import type {
  ApplicationAnswer,
  ApplicationAttachment,
  CandidateApplicationDetail,
  JobPostingQuestion,
  ResumeEducation,
  ResumeExperience,
  SaveApplicationDraftPayload,
} from "@/entities/recruitment/model";
import {
  formatDateTime,
  formatFileSize,
  getApplicationStatusClassName,
  getApplicationStatusLabel,
} from "@/shared/lib/recruitment";

interface ApplicationDraftFormProps {
  candidateSession: CandidateSession;
  jobPostingId: number;
  canSave: boolean;
  helperText: string;
  initialApplication?: CandidateApplicationDetail | null;
  questions: JobPostingQuestion[];
}

interface DraftFormValues {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  introduction: string;
  coreStrength: string;
  careerYears: string;
  motivationFit: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  endDate: string;
}

interface CareerEntry {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

type FormActionMode = "draft" | "submit";
type StepState = 1 | 2 | 3 | 4;

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
const inputClassName =
  "mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20";
const textareaClassName = `${inputClassName} min-h-[128px] resize-y`;
const initialFormValues: DraftFormValues = {
  applicantName: "",
  applicantEmail: "",
  applicantPhone: "",
  introduction: "",
  coreStrength: "",
  careerYears: "",
  motivationFit: "",
};
const formSteps: Array<{ value: StepState; label: string; description: string }> = [
  { value: 1, label: "기본 정보", description: "계정 기반 기본 정보와 지원 방향을 확인합니다." },
  { value: 2, label: "이력 작성", description: "자기소개, 학력, 경력 정보를 채웁니다." },
  { value: 3, label: "공고 질문", description: "공고별 질문에 맞춰 추가 답변을 작성합니다." },
  { value: 4, label: "제출 확인", description: "첨부파일과 최종 제출 상태를 확인합니다." },
];

function toEducationEntry(education: ResumeEducation): EducationEntry {
  return {
    institution: education.institution ?? "",
    degree: education.degree ?? "",
    fieldOfStudy: education.fieldOfStudy ?? "",
    endDate: education.endDate ?? "",
  };
}

function toCareerEntry(experience: ResumeExperience): CareerEntry {
  return {
    company: experience.company ?? "",
    position: experience.position ?? "",
    startDate: experience.startDate ?? "",
    endDate: experience.endDate ?? "",
    description: experience.description ?? "",
  };
}

function buildInitialValues(candidateSession: CandidateSession, initialApplication?: CandidateApplicationDetail | null): DraftFormValues {
  const resumePayload = initialApplication?.resumePayload ?? {};
  const introduction = typeof resumePayload.introduction === "string" ? resumePayload.introduction : "";
  const coreStrength = typeof resumePayload.coreStrength === "string" ? resumePayload.coreStrength : "";
  const motivationFit = typeof initialApplication?.motivationFit === "string"
    ? initialApplication.motivationFit
    : typeof resumePayload.motivationFit === "string"
      ? resumePayload.motivationFit
      : "";
  const careerYearsValue = resumePayload.careerYears;
  const careerYears = typeof careerYearsValue === "number" || typeof careerYearsValue === "string"
    ? String(careerYearsValue)
    : "";

  return {
    ...initialFormValues,
    applicantName: initialApplication?.applicantName ?? candidateSession.name,
    applicantEmail: initialApplication?.applicantEmail ?? candidateSession.email,
    applicantPhone: initialApplication?.applicantPhone ?? candidateSession.phone,
    introduction,
    coreStrength,
    careerYears,
    motivationFit,
  };
}

function buildInitialAnswers(questions: JobPostingQuestion[], initialApplication?: CandidateApplicationDetail | null): ApplicationAnswer[] {
  const answerMap = new Map((initialApplication?.answers ?? []).map((answer) => [answer.questionId, answer]));
  return questions.map((question) => {
    const answer = answerMap.get(question.id);
    return {
      questionId: question.id,
      answerText: answer?.answerText ?? null,
      answerChoice: answer?.answerChoice ?? null,
      answerScale: answer?.answerScale ?? null,
    };
  });
}


function normalizeAttachment(attachment: ApplicationAttachment | AttachmentSummary): ApplicationAttachment {
  if ("originalName" in attachment) return attachment;
  return {
    id: attachment.id,
    applicationId: attachment.applicationId,
    originalName: attachment.originalFilename,
    contentType: attachment.contentType,
    fileSize: attachment.fileSizeBytes,
    createdAt: attachment.uploadedAt,
  };
}

function parseQuestionChoices(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean);
    }
  } catch {}
  return raw.split(/[\n,|]/).map((value) => value.trim()).filter(Boolean);
}

function getStepClassName(step: StepState, currentStep: StepState) {
  if (step === currentStep) return "border-primary bg-primary text-primary-foreground";
  if (step < currentStep) return "border-primary bg-primary/10 text-primary";
  return "border-outline-variant bg-surface-container-low text-on-surface-variant";
}

export function ApplicationDraftForm({
  candidateSession,
  jobPostingId,
  canSave,
  helperText,
  initialApplication = null,
  questions,
}: ApplicationDraftFormProps) {
  const [formValues, setFormValues] = useState(() => buildInitialValues(candidateSession, initialApplication));
  const [educations, setEducations] = useState<EducationEntry[]>(() => initialApplication?.educations.map(toEducationEntry) ?? []);
  const [careers, setCareers] = useState<CareerEntry[]>(() => initialApplication?.experiences.map(toCareerEntry) ?? []);
  const [application, setApplication] = useState<CandidateApplicationDetail | null>(initialApplication);
  const [currentStep, setCurrentStep] = useState<StepState>(((initialApplication?.currentStep ?? 1) as StepState) || 1);
  const [answers, setAnswers] = useState<ApplicationAnswer[]>(() => buildInitialAnswers(questions, initialApplication));
  const [attachments, setAttachments] = useState<ApplicationAttachment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<FormActionMode | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitted = application?.status === "SUBMITTED";
  const formDisabled = !canSave || isSubmitted || pendingAction !== null;
  const statusLabel = useMemo(() => (application ? getApplicationStatusLabel(application.status) : null), [application]);

  useEffect(() => {
    async function loadAttachments(applicationId: number) {
      const response = await fetch(`/api/applications/${applicationId}/attachments`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as AttachmentSummary[];
      setAttachments(data.map(normalizeAttachment));
    }
    if (application?.applicationId) void loadAttachments(application.applicationId);
  }, [application?.applicationId]);

  function updateField(field: keyof DraftFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }));
  }

  function updateEducation(index: number, field: keyof EducationEntry, value: string) {
    setEducations((current) => current.map((education, currentIndex) => currentIndex === index ? { ...education, [field]: value } : education));
  }

  function updateCareer(index: number, field: keyof CareerEntry, value: string) {
    setCareers((current) => current.map((career, currentIndex) => currentIndex === index ? { ...career, [field]: value } : career));
  }

  function updateAnswer(questionId: number, patch: Partial<ApplicationAnswer>) {
    setAnswers((current) => current.map((answer) => answer.questionId === questionId ? { ...answer, ...patch } : answer));
  }

  function buildPayload(): SaveApplicationDraftPayload {
    const payload: SaveApplicationDraftPayload = {
      resumePayload: {
        introduction: formValues.introduction.trim(),
        coreStrength: formValues.coreStrength.trim(),
        currentStep,
        motivationFit: formValues.motivationFit.trim(),
        answers,
      },
    };

    if (formValues.careerYears.trim()) {
      payload.resumePayload.careerYears = Number(formValues.careerYears.trim());
    }

    if (educations.length > 0) {
      payload.educations = educations.map((education, index) => ({
        institution: education.institution.trim(),
        degree: education.degree.trim(),
        fieldOfStudy: education.fieldOfStudy.trim(),
        startDate: null,
        endDate: education.endDate || null,
        description: "",
        sortOrder: index,
      }));
    }

    if (careers.length > 0) {
      payload.experiences = careers.map((career, index) => ({
        company: career.company.trim(),
        position: career.position.trim(),
        startDate: career.startDate || null,
        endDate: career.endDate || null,
        description: career.description.trim(),
        sortOrder: index,
      }));
    }

    return payload;
  }

  async function refreshApplication() {
    const response = await fetch(`/api/job-postings/${jobPostingId}/application`, { cache: "no-store" });
    if (!response.ok) return;
    const detail = (await response.json()) as CandidateApplicationDetail;
    setApplication(detail);
    setCurrentStep(((detail.currentStep ?? 1) as StepState) || 1);
    setAnswers(buildInitialAnswers(questions, detail));
  }

  async function handleSubmit(mode: FormActionMode) {
    setPendingAction(mode);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(
        mode === "draft"
          ? `/api/job-postings/${jobPostingId}/application-draft`
          : `/api/job-postings/${jobPostingId}/application-submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        },
      );

      const responseBody = (await response.json()) as { message?: string };
      if (!response.ok) {
        setErrorMessage(responseBody.message ?? (mode === "draft" ? "지원서를 임시 저장하지 못했습니다." : "지원서를 제출하지 못했습니다."));
        return;
      }

      await refreshApplication();
      setMessage(mode === "draft" ? "임시 저장되었습니다." : "지원서 제출이 완료되었습니다.");
    } catch {
      setErrorMessage(mode === "draft" ? "임시 저장 중 오류가 발생했습니다." : "제출 중 오류가 발생했습니다.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleFileUpload(files: FileList) {
    if (!application?.applicationId) {
      setErrorMessage("임시 저장 후 첨부파일을 업로드할 수 있습니다.");
      return;
    }

    setUploadingFiles(true);
    setErrorMessage(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/applications/${application.applicationId}/attachments`, {
        method: "POST",
        body: formData,
      });
      const responseBody = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(responseBody?.message ?? `${file.name} 업로드에 실패했습니다.`);
        continue;
      }
      setAttachments((current) => [...current, normalizeAttachment(responseBody as AttachmentSummary)]);
    }

    setUploadingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteAttachment(attachmentId: number) {
    const response = await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" });
    if (!response.ok) {
      setErrorMessage("첨부파일을 삭제하지 못했습니다.");
      return;
    }
    setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  }

  return (
    <section className="rounded-sm border border-outline-variant bg-card p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">지원서 작성</h2>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">{helperText}</p>
        </div>
        {statusLabel ? (
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${getApplicationStatusClassName(application!.status)}`}>
            {statusLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {formSteps.map((step) => (
          <button
            key={step.value}
            type="button"
            disabled={isSubmitted}
            onClick={() => setCurrentStep(step.value)}
            className={`rounded-lg border px-4 py-4 text-left transition-colors ${getStepClassName(step.value, currentStep)}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">Step {step.value}</p>
            <p className="mt-2 text-sm font-semibold">{step.label}</p>
            <p className="mt-2 text-xs leading-6 opacity-90">{step.description}</p>
          </button>
        ))}
      </div>

      {message ? <div className="mt-5 rounded-lg bg-secondary-container px-4 py-3 text-sm text-[#00731e]">{message}</div> : null}
      {errorMessage ? <div className="mt-5 rounded-lg bg-error-container px-4 py-3 text-sm text-destructive">{errorMessage}</div> : null}

      {application ? (
        <div className="mt-5 rounded-lg bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
          <p>{isSubmitted ? "이미 제출된 지원서입니다. 아래 내용은 읽기 전용으로 표시됩니다." : "이전에 저장한 지원서를 불러왔습니다. 이어서 작성할 수 있습니다."}</p>
          <p className="mt-2">
            마지막 저장: {formatDateTime(application.draftSavedAt)}
            {application.submittedAt ? ` | 제출 완료: ${formatDateTime(application.submittedAt)}` : ""}
          </p>
        </div>
      ) : null}

      <form className="mt-6 space-y-7" onSubmit={(event) => event.preventDefault()}>
        <section className="grid gap-5">
          <div className="rounded-lg bg-surface-container-low px-4 py-4 text-sm leading-7 text-on-surface-variant">
            로그인한 지원자 계정 정보를 기본값으로 사용합니다. 이름, 이메일, 휴대전화는 계정 정보와 동기화되어 읽기 전용입니다.
          </div>

          <label className="block text-sm font-semibold text-on-surface-variant">이름<input className={inputClassName} value={formValues.applicantName} readOnly disabled /></label>
          <label className="block text-sm font-semibold text-on-surface-variant">이메일<input className={inputClassName} value={formValues.applicantEmail} readOnly disabled /></label>
          <label className="block text-sm font-semibold text-on-surface-variant">휴대전화<input className={inputClassName} value={formValues.applicantPhone} readOnly disabled /></label>
          <label className="block text-sm font-semibold text-on-surface-variant">
            이 공고에 지원하는 이유
            <textarea className={textareaClassName} value={formValues.motivationFit} disabled={formDisabled} onChange={(event) => updateField("motivationFit", event.target.value)} placeholder="이 공고를 선택한 이유와 팀에 기여할 수 있는 지점을 작성해 주세요." />
          </label>
        </section>

        <section className="grid gap-5">
          <label className="block text-sm font-semibold text-on-surface-variant">자기소개<textarea className={textareaClassName} value={formValues.introduction} disabled={formDisabled} onChange={(event) => updateField("introduction", event.target.value)} placeholder="지원 동기와 본인의 강점을 중심으로 작성해 주세요." /></label>
          <label className="block text-sm font-semibold text-on-surface-variant">핵심 강점<textarea className={textareaClassName} value={formValues.coreStrength} disabled={formDisabled} onChange={(event) => updateField("coreStrength", event.target.value)} placeholder="이 직무에서 발휘할 수 있는 핵심 강점을 적어 주세요." /></label>
          <label className="block text-sm font-semibold text-on-surface-variant">경력 연차<input className={inputClassName} type="number" min={0} max={40} value={formValues.careerYears} disabled={formDisabled} onChange={(event) => updateField("careerYears", event.target.value)} placeholder="예: 5" /></label>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-on-surface">학력</h3>
            <button type="button" disabled={formDisabled} onClick={() => setEducations((current) => [...current, { institution: "", degree: "", fieldOfStudy: "", endDate: "" }])} className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-on-surface">학력 추가</button>
          </div>
          <div className="space-y-4">
            {educations.map((education, index) => (
              <div key={`education-${index}`} className="rounded-lg bg-surface-container-low p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input className={inputClassName} value={education.institution} disabled={formDisabled} onChange={(event) => updateEducation(index, "institution", event.target.value)} placeholder="학교명" />
                  <input className={inputClassName} value={education.fieldOfStudy} disabled={formDisabled} onChange={(event) => updateEducation(index, "fieldOfStudy", event.target.value)} placeholder="전공" />
                  <input className={inputClassName} value={education.degree} disabled={formDisabled} onChange={(event) => updateEducation(index, "degree", event.target.value)} placeholder="학위" />
                  <input className={inputClassName} type="date" value={education.endDate} disabled={formDisabled} onChange={(event) => updateEducation(index, "endDate", event.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-on-surface">경력</h3>
            <button type="button" disabled={formDisabled} onClick={() => setCareers((current) => [...current, { company: "", position: "", startDate: "", endDate: "", description: "" }])} className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-on-surface">경력 추가</button>
          </div>
          <div className="space-y-4">
            {careers.map((career, index) => (
              <div key={`career-${index}`} className="rounded-lg bg-surface-container-low p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input className={inputClassName} value={career.company} disabled={formDisabled} onChange={(event) => updateCareer(index, "company", event.target.value)} placeholder="회사명" />
                  <input className={inputClassName} value={career.position} disabled={formDisabled} onChange={(event) => updateCareer(index, "position", event.target.value)} placeholder="직무" />
                  <input className={inputClassName} type="date" value={career.startDate} disabled={formDisabled} onChange={(event) => updateCareer(index, "startDate", event.target.value)} />
                  <input className={inputClassName} type="date" value={career.endDate} disabled={formDisabled} onChange={(event) => updateCareer(index, "endDate", event.target.value)} />
                </div>
                <textarea className={textareaClassName} value={career.description} disabled={formDisabled} onChange={(event) => updateCareer(index, "description", event.target.value)} placeholder="담당 업무와 성과를 적어 주세요." />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-on-surface">공고별 질문</h3>
            <p className="mt-1 text-sm text-on-surface-variant">공고별 질문이 있는 경우 저장 후 다시 들어와도 이전 답변이 그대로 복원됩니다.</p>
          </div>
          {questions.length === 0 ? (
            <div className="rounded-lg bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">이 공고에는 추가 질문이 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => {
                const answer = answers.find((current) => current.questionId === question.id) ?? { questionId: question.id, answerText: null, answerChoice: null, answerScale: null };
                const choices = parseQuestionChoices(question.choices);
                return (
                  <div key={question.id} className="rounded-lg bg-surface-container-low p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">질문 {index + 1}</p>
                        <h4 className="mt-2 text-base font-semibold text-on-surface">{question.questionText}</h4>
                      </div>
                      {question.required ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">필수</span> : null}
                    </div>
                    {question.questionType === "TEXT" ? (
                      <textarea className={textareaClassName} value={answer.answerText ?? ""} disabled={formDisabled} onChange={(event) => updateAnswer(question.id, { answerText: event.target.value, answerChoice: null, answerScale: null })} placeholder="답변을 입력해 주세요." />
                    ) : null}
                    {question.questionType === "CHOICE" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {choices.map((choice) => (
                          <button key={choice} type="button" disabled={formDisabled} onClick={() => updateAnswer(question.id, { answerText: null, answerChoice: choice, answerScale: null })} className={`rounded-full border px-4 py-2 text-sm transition-colors ${answer.answerChoice === choice ? "border-primary bg-primary text-primary-foreground" : "border-outline-variant bg-card text-on-surface"}`}>
                            {choice}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {question.questionType === "SCALE" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((scaleValue) => (
                          <button key={scaleValue} type="button" disabled={formDisabled} onClick={() => updateAnswer(question.id, { answerText: null, answerChoice: null, answerScale: scaleValue })} className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${answer.answerScale === scaleValue ? "border-primary bg-primary text-primary-foreground" : "border-outline-variant bg-card text-on-surface"}`}>
                            {scaleValue}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-on-surface">첨부파일</h3>
            <p className="mt-1 text-sm text-on-surface-variant">임시 저장 후 PDF, DOC, DOCX, JPG, PNG 파일을 업로드할 수 있습니다.</p>
          </div>
          <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_FILE_TYPES} disabled={formDisabled || uploadingFiles || !application?.applicationId} onChange={(event) => { if (event.target.files?.length) void handleFileUpload(event.target.files); }} className="block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-surface-container-high file:px-4 file:py-2 file:text-sm file:font-semibold file:text-on-surface" />
          {attachments.length > 0 ? (
            <ul className="space-y-2">
              {attachments.map((attachment) => (
                <li key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-4 py-3">
                  <div className="min-w-0">
                    <a href={`/api/attachments/${attachment.id}/download`} className="truncate text-sm font-medium text-primary hover:underline">{attachment.originalName}</a>
                    <p className="mt-1 text-xs text-on-surface-variant">{formatFileSize(attachment.fileSize)}</p>
                  </div>
                  <button type="button" disabled={formDisabled} onClick={() => void handleDeleteAttachment(attachment.id)} className="rounded-sm border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface">삭제</button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {isSubmitted ? <div className="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">이미 제출된 지원서입니다.</div> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={formDisabled} onClick={() => { startTransition(() => { void handleSubmit("draft"); }); }} className="rounded-sm border border-outline-variant px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-on-surface">{pendingAction === "draft" ? "저장 중.." : "임시 저장"}</button>
          <button type="button" disabled={formDisabled} onClick={() => { startTransition(() => { void handleSubmit("submit"); }); }} className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground">{pendingAction === "submit" ? "제출 중.." : "최종 제출"}</button>
        </div>
      </form>
    </section>
  );
}
