"use client";

import { startTransition, useRef, useState } from "react";

import type {
  ApplicationAttachment,
  ApplicationDraftResponse,
} from "@/entities/recruitment/model";
import {
  type DraftActionState,
  type DraftFieldName,
  initialDraftActionState,
} from "@/features/recruitment/application/draft-state";
import {
  formatDateTime,
  getApplicationStatusLabel,
} from "@/shared/lib/recruitment";

interface ApplicationDraftFormProps {
  jobPostingId: number;
  canSave: boolean;
  helperText: string;
}

interface DraftFormValues {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  introduction: string;
  coreStrength: string;
  careerYears: string;
}

interface EducationEntry {
  schoolName: string;
  major: string;
  degree: string;
  graduatedAt: string;
}

interface CareerEntry {
  companyName: string;
  position: string;
  startedAt: string;
  endedAt: string;
  description: string;
}

type FormActionMode = "draft" | "submit";

const DEGREE_OPTIONS = [
  { value: "", label: "학위 선택" },
  { value: "HIGH_SCHOOL", label: "고등학교 졸업" },
  { value: "ASSOCIATE", label: "전문학사" },
  { value: "BACHELOR", label: "학사" },
  { value: "MASTER", label: "석사" },
  { value: "DOCTORATE", label: "박사" },
];

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png";

const inputClassName =
  "w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

const selectClassName =
  "w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

const sectionHeadingClassName =
  "text-lg font-bold text-on-surface";

const initialFormValues: DraftFormValues = {
  applicantName: "",
  applicantEmail: "",
  applicantPhone: "",
  introduction: "",
  coreStrength: "",
  careerYears: "",
};

function emptyEducation(): EducationEntry {
  return { schoolName: "", major: "", degree: "", graduatedAt: "" };
}

function emptyCareer(): CareerEntry {
  return {
    companyName: "",
    position: "",
    startedAt: "",
    endedAt: "",
    description: "",
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateDraftFields(values: DraftFormValues, mode: FormActionMode) {
  const fieldErrors: DraftActionState["fieldErrors"] = {};

  if (values.applicantName.trim().length < 2) {
    fieldErrors.applicantName = "이름은 두 글자 이상 입력해주세요.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.applicantEmail.trim())) {
    fieldErrors.applicantEmail = "올바른 이메일 주소를 입력해주세요.";
  }

  if (!/^[0-9+\-() ]{8,40}$/.test(values.applicantPhone.trim())) {
    fieldErrors.applicantPhone = "올바른 연락처를 입력해주세요.";
  }

  if (
    values.introduction.trim() &&
    values.introduction.trim().length < 20
  ) {
    fieldErrors.introduction =
      "자기소개는 20자 이상 입력해주세요.";
  }

  if (mode === "submit" && values.introduction.trim().length < 20) {
    fieldErrors.introduction =
      "최종 제출 전 자기소개를 20자 이상 입력해주세요.";
  }

  if (mode === "submit" && values.coreStrength.trim().length < 10) {
    fieldErrors.coreStrength =
      "최종 제출 전 핵심 역량을 10자 이상 입력해주세요.";
  }

  if (
    values.careerYears.trim() &&
    (!/^\d+$/.test(values.careerYears.trim()) ||
      Number(values.careerYears.trim()) > 40)
  ) {
    fieldErrors.careerYears =
      "경력 연수는 0~40 사이의 숫자로 입력해주세요.";
  }

  return fieldErrors;
}

export function ApplicationDraftForm({
  jobPostingId,
  canSave,
  helperText,
}: ApplicationDraftFormProps) {
  const [formValues, setFormValues] = useState(initialFormValues);
  const [state, setState] = useState(initialDraftActionState);
  const [pendingAction, setPendingAction] = useState<FormActionMode | null>(
    null,
  );

  // Attachments
  const [attachments, setAttachments] = useState<ApplicationAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Education history
  const [educations, setEducations] = useState<EducationEntry[]>([]);

  // Career history
  const [careers, setCareers] = useState<CareerEntry[]>([]);

  const isPending = pendingAction !== null;
  const isSubmitted = state.currentStatus === "SUBMITTED";

  function updateField(fieldName: DraftFieldName, value: string) {
    setFormValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  // --- Education helpers ---
  function addEducation() {
    setEducations((current) => [...current, emptyEducation()]);
  }

  function removeEducation(index: number) {
    setEducations((current) => current.filter((_, i) => i !== index));
  }

  function updateEducation(
    index: number,
    field: keyof EducationEntry,
    value: string,
  ) {
    setEducations((current) =>
      current.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  // --- Career helpers ---
  function addCareer() {
    setCareers((current) => [...current, emptyCareer()]);
  }

  function removeCareer(index: number) {
    setCareers((current) => current.filter((_, i) => i !== index));
  }

  function updateCareer(
    index: number,
    field: keyof CareerEntry,
    value: string,
  ) {
    setCareers((current) =>
      current.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  // --- File upload ---
  async function handleFileUpload(files: FileList) {
    if (!formValues.applicantEmail.trim()) {
      setState((current) => ({
        ...current,
        status: "error",
        message: "파일 업로드 전 이메일 주소를 먼저 입력해주세요.",
        fieldErrors: {
          ...current.fieldErrors,
          applicantEmail: "파일 업로드 전 이메일을 입력해주세요.",
        },
      }));
      return;
    }

    setUploadingFiles(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          `/api/job-postings/${jobPostingId}/application-draft/attachments?applicantEmail=${encodeURIComponent(formValues.applicantEmail.trim())}`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const errorBody = (await response.json()) as { message?: string };
          setState((current) => ({
            ...current,
            status: "error",
            message:
              errorBody.message ??
              `파일 "${file.name}" 업로드에 실패했습니다.`,
          }));
          continue;
        }

        const attachment = (await response.json()) as ApplicationAttachment;
        setAttachments((current) => [...current, attachment]);
      } catch {
        setState((current) => ({
          ...current,
          status: "error",
          message: `파일 "${file.name}" 업로드 중 오류가 발생했습니다.`,
        }));
      }
    }

    setUploadingFiles(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleDeleteAttachment(attachmentId: number) {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { message?: string };
        setState((current) => ({
          ...current,
          status: "error",
          message: errorBody.message ?? "파일 삭제에 실패했습니다.",
        }));
        return;
      }

      setAttachments((current) =>
        current.filter((a) => a.id !== attachmentId),
      );
    } catch {
      setState((current) => ({
        ...current,
        status: "error",
        message: "파일 삭제 중 오류가 발생했습니다.",
      }));
    }
  }

  function buildPayload() {
    return {
      applicantName: formValues.applicantName.trim(),
      applicantEmail: formValues.applicantEmail.trim(),
      applicantPhone: formValues.applicantPhone.trim(),
      resumePayload: {
        ...(formValues.introduction.trim()
          ? { introduction: formValues.introduction.trim() }
          : {}),
        ...(formValues.coreStrength.trim()
          ? { coreStrength: formValues.coreStrength.trim() }
          : {}),
        ...(formValues.careerYears.trim()
          ? { careerYears: Number(formValues.careerYears.trim()) }
          : {}),
        ...(educations.length > 0
          ? {
              education: educations.map((e, i) => ({
                ...e,
                sortOrder: i,
              })),
            }
          : {}),
        ...(careers.length > 0
          ? {
              career: careers.map((c, i) => ({
                ...c,
                sortOrder: i,
              })),
            }
          : {}),
      },
    };
  }

  async function submitDraft(mode: FormActionMode) {
    const endpoint =
      mode === "draft"
        ? `/api/job-postings/${jobPostingId}/application-draft`
        : `/api/job-postings/${jobPostingId}/application-submit`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const responseBody = (await response.json()) as
        | ApplicationDraftResponse
        | { message?: string };

      if (!response.ok) {
        const errorMessage =
          "message" in responseBody
            ? responseBody.message
            : undefined;
        setState({
          status: "error",
          message:
            errorMessage ??
            (mode === "submit"
              ? "지원서 제출에 실패했습니다."
              : "임시저장에 실패했습니다."),
          fieldErrors: {},
          savedAt: null,
          submittedAt: null,
          applicationId: null,
          currentStatus:
            errorMessage?.includes("already submitted") ? "SUBMITTED" : null,
        });
        return;
      }

      if (!("applicantEmail" in responseBody)) {
        setState({
          status: "error",
          message: "지원서 응답 데이터가 올바르지 않습니다.",
          fieldErrors: {},
          savedAt: null,
          submittedAt: null,
          applicationId: null,
          currentStatus: null,
        });
        return;
      }

      setState({
        status: "success",
        message:
          responseBody.status === "SUBMITTED"
            ? `${responseBody.applicantEmail} 님의 지원서가 최종 제출되었습니다.`
            : `${responseBody.applicantEmail} 님의 지원서가 임시저장되었습니다.`,
        fieldErrors: {},
        savedAt: responseBody.draftSavedAt,
        submittedAt: responseBody.submittedAt,
        applicationId: responseBody.applicationId,
        currentStatus: responseBody.status,
      });
    } catch {
      setState({
        status: "error",
        message:
          mode === "submit"
            ? "지원서 제출 중 예기치 않은 오류가 발생했습니다."
            : "임시저장 중 예기치 않은 오류가 발생했습니다.",
        fieldErrors: {},
        savedAt: null,
        submittedAt: null,
        applicationId: null,
        currentStatus: null,
      });
    } finally {
      setPendingAction(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nativeEvent = event.nativeEvent as SubmitEvent;
    const submitter = nativeEvent.submitter as HTMLButtonElement | null;
    const mode = submitter?.value === "submit" ? "submit" : "draft";

    const fieldErrors = validateDraftFields(formValues, mode);
    if (Object.keys(fieldErrors).length > 0) {
      setState({
        status: "error",
        message: "입력 내용을 확인하고 다시 시도해주세요.",
        fieldErrors,
        savedAt: null,
        submittedAt: null,
        applicationId: null,
        currentStatus: null,
      });
      return;
    }

    setPendingAction(mode);
    setState((current) => ({
      ...current,
      status: "idle",
      message: null,
      fieldErrors: {},
    }));

    startTransition(() => {
      void submitDraft(mode);
    });
  }

  const formDisabled = !canSave || isPending || isSubmitted;

  return (
    <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-7">
      <h2 className="font-headline text-2xl font-bold text-on-surface">
        지원하기
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        {helperText}
      </p>

      {state.message ? (
        <div
          className={`mt-5 rounded-lg px-4 py-3 text-sm ${
            state.status === "success"
              ? "bg-secondary-container text-[#00731e]"
              : "bg-error-container text-destructive"
          }`}
        >
          <p>{state.message}</p>
          {state.status === "success" && state.savedAt ? (
            <p className="mt-2 text-xs opacity-80">
              상태:{" "}
              {getApplicationStatusLabel(state.currentStatus ?? "DRAFT")} |
              저장 시각: {formatDateTime(state.savedAt)}
              {state.submittedAt
                ? ` | 제출 시각: ${formatDateTime(state.submittedAt)}`
                : ""}
              {state.applicationId
                ? ` | 지원서 #${state.applicationId}`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {!canSave ? (
        <div className="mt-5 rounded-lg bg-surface-container-high px-4 py-4 text-sm text-on-surface-variant">
          현재 지원 기간이 아니라 임시저장 및 제출이 비활성화되어 있습니다.
        </div>
      ) : null}

      {isSubmitted ? (
        <div className="mt-5 rounded-lg bg-secondary-container/50 px-4 py-4 text-sm text-[#00731e]">
          이미 최종 제출된 지원서입니다. 추가 수정이 불가합니다.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* --- 기본 정보 --- */}
        <div className="grid gap-5">
          <label className="block text-sm font-semibold text-on-surface-variant">
            지원자 이름
            <input
              name="applicantName"
              type="text"
              autoComplete="name"
              placeholder="김지원"
              required
              minLength={2}
              disabled={formDisabled}
              aria-invalid={Boolean(state.fieldErrors.applicantName)}
              className={`mt-2 ${inputClassName}`}
              value={formValues.applicantName}
              onChange={(event) =>
                updateField("applicantName", event.target.value)
              }
            />
            {state.fieldErrors.applicantName ? (
              <span className="mt-2 block text-xs text-destructive">
                {state.fieldErrors.applicantName}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            이메일
            <input
              name="applicantEmail"
              type="email"
              autoComplete="email"
              placeholder="applicant@example.com"
              required
              disabled={formDisabled}
              aria-invalid={Boolean(state.fieldErrors.applicantEmail)}
              className={`mt-2 ${inputClassName}`}
              value={formValues.applicantEmail}
              onChange={(event) =>
                updateField("applicantEmail", event.target.value)
              }
            />
            {state.fieldErrors.applicantEmail ? (
              <span className="mt-2 block text-xs text-destructive">
                {state.fieldErrors.applicantEmail}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            연락처
            <input
              name="applicantPhone"
              type="tel"
              autoComplete="tel"
              placeholder="010-1234-5678"
              required
              disabled={formDisabled}
              aria-invalid={Boolean(state.fieldErrors.applicantPhone)}
              className={`mt-2 ${inputClassName}`}
              value={formValues.applicantPhone}
              onChange={(event) =>
                updateField("applicantPhone", event.target.value)
              }
            />
            {state.fieldErrors.applicantPhone ? (
              <span className="mt-2 block text-xs text-destructive">
                {state.fieldErrors.applicantPhone}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            자기소개
            <textarea
              name="introduction"
              rows={5}
              placeholder="관련 경험과 지원 동기를 간략히 소개해주세요."
              disabled={formDisabled}
              aria-invalid={Boolean(state.fieldErrors.introduction)}
              className={`mt-2 resize-y ${inputClassName}`}
              value={formValues.introduction}
              onChange={(event) =>
                updateField("introduction", event.target.value)
              }
            />
            {state.fieldErrors.introduction ? (
              <span className="mt-2 block text-xs text-destructive">
                {state.fieldErrors.introduction}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            핵심 역량
            <textarea
              name="coreStrength"
              rows={4}
              placeholder="이 직무에서 발휘할 수 있는 가장 강점을 설명해주세요."
              disabled={formDisabled}
              className={`mt-2 resize-y ${inputClassName}`}
              value={formValues.coreStrength}
              onChange={(event) =>
                updateField("coreStrength", event.target.value)
              }
            />
            {state.fieldErrors.coreStrength ? (
              <span className="mt-2 block text-xs text-destructive">
                {state.fieldErrors.coreStrength}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            경력 연수
            <input
              name="careerYears"
              type="number"
              min={0}
              max={40}
              placeholder="6"
              disabled={formDisabled}
              aria-invalid={Boolean(state.fieldErrors.careerYears)}
              className={`mt-2 ${inputClassName}`}
              value={formValues.careerYears}
              onChange={(event) =>
                updateField("careerYears", event.target.value)
              }
            />
            {state.fieldErrors.careerYears ? (
              <span className="mt-2 block text-xs text-destructive">
                {state.fieldErrors.careerYears}
              </span>
            ) : null}
          </label>
        </div>

        {/* --- 학력 사항 --- */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className={sectionHeadingClassName}>학력 사항</h3>
            <button
              type="button"
              disabled={formDisabled}
              onClick={addEducation}
              className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50"
            >
              + 학력 추가
            </button>
          </div>

          {educations.length === 0 ? (
            <p className="mt-3 text-sm text-on-surface-variant">
              등록된 학력이 없습니다. 위 버튼을 눌러 추가하세요.
            </p>
          ) : null}

          <div className="mt-4 space-y-4">
            {educations.map((edu, index) => (
              <div
                key={index}
                className="rounded-lg bg-surface-container p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface-variant">
                    학력 #{index + 1}
                  </span>
                  <button
                    type="button"
                    disabled={formDisabled}
                    onClick={() => removeEducation(index)}
                    className="rounded-md px-3 py-1 text-xs font-medium text-destructive transition hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-on-surface-variant">
                    학교명
                    <input
                      type="text"
                      placeholder="서울대학교"
                      disabled={formDisabled}
                      className={`mt-1 ${inputClassName}`}
                      value={edu.schoolName}
                      onChange={(e) =>
                        updateEducation(index, "schoolName", e.target.value)
                      }
                    />
                  </label>
                  <label className="block text-sm text-on-surface-variant">
                    전공
                    <input
                      type="text"
                      placeholder="컴퓨터공학"
                      disabled={formDisabled}
                      className={`mt-1 ${inputClassName}`}
                      value={edu.major}
                      onChange={(e) =>
                        updateEducation(index, "major", e.target.value)
                      }
                    />
                  </label>
                  <label className="block text-sm text-on-surface-variant">
                    학위
                    <select
                      disabled={formDisabled}
                      className={`mt-1 ${selectClassName}`}
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(index, "degree", e.target.value)
                      }
                    >
                      {DEGREE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-on-surface-variant">
                    졸업일
                    <input
                      type="date"
                      disabled={formDisabled}
                      className={`mt-1 ${inputClassName}`}
                      value={edu.graduatedAt}
                      onChange={(e) =>
                        updateEducation(index, "graduatedAt", e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- 경력 사항 --- */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className={sectionHeadingClassName}>경력 사항</h3>
            <button
              type="button"
              disabled={formDisabled}
              onClick={addCareer}
              className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50"
            >
              + 경력 추가
            </button>
          </div>

          {careers.length === 0 ? (
            <p className="mt-3 text-sm text-on-surface-variant">
              등록된 경력이 없습니다. 위 버튼을 눌러 추가하세요.
            </p>
          ) : null}

          <div className="mt-4 space-y-4">
            {careers.map((career, index) => (
              <div
                key={index}
                className="rounded-lg bg-surface-container p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface-variant">
                    경력 #{index + 1}
                  </span>
                  <button
                    type="button"
                    disabled={formDisabled}
                    onClick={() => removeCareer(index)}
                    className="rounded-md px-3 py-1 text-xs font-medium text-destructive transition hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-on-surface-variant">
                    회사명
                    <input
                      type="text"
                      placeholder="네이버"
                      disabled={formDisabled}
                      className={`mt-1 ${inputClassName}`}
                      value={career.companyName}
                      onChange={(e) =>
                        updateCareer(index, "companyName", e.target.value)
                      }
                    />
                  </label>
                  <label className="block text-sm text-on-surface-variant">
                    직책
                    <input
                      type="text"
                      placeholder="백엔드 개발자"
                      disabled={formDisabled}
                      className={`mt-1 ${inputClassName}`}
                      value={career.position}
                      onChange={(e) =>
                        updateCareer(index, "position", e.target.value)
                      }
                    />
                  </label>
                  <label className="block text-sm text-on-surface-variant">
                    입사일
                    <input
                      type="date"
                      disabled={formDisabled}
                      className={`mt-1 ${inputClassName}`}
                      value={career.startedAt}
                      onChange={(e) =>
                        updateCareer(index, "startedAt", e.target.value)
                      }
                    />
                  </label>
                  <label className="block text-sm text-on-surface-variant">
                    퇴사일
                    <input
                      type="date"
                      disabled={formDisabled}
                      className={`mt-1 ${inputClassName}`}
                      value={career.endedAt}
                      onChange={(e) =>
                        updateCareer(index, "endedAt", e.target.value)
                      }
                    />
                  </label>
                </div>
                <label className="mt-3 block text-sm text-on-surface-variant">
                  업무 내용
                  <textarea
                    rows={3}
                    placeholder="담당 업무 및 성과를 간략히 기술해주세요."
                    disabled={formDisabled}
                    className={`mt-1 resize-y ${inputClassName}`}
                    value={career.description}
                    onChange={(e) =>
                      updateCareer(index, "description", e.target.value)
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* --- 첨부파일 --- */}
        <div>
          <h3 className={sectionHeadingClassName}>첨부파일</h3>
          <p className="mt-1 text-xs text-on-surface-variant">
            PDF, DOC, DOCX, JPG, PNG 파일을 업로드할 수 있습니다.
          </p>

          <div className="mt-3 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES}
              disabled={formDisabled || uploadingFiles}
              className="block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-surface-container-high file:px-4 file:py-2 file:text-sm file:font-semibold file:text-on-surface file:transition hover:file:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void handleFileUpload(e.target.files);
                }
              }}
            />
            {uploadingFiles ? (
              <span className="shrink-0 text-sm text-on-surface-variant">
                업로드 중...
              </span>
            ) : null}
          </div>

          {attachments.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center justify-between rounded-lg bg-surface-container px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/api/attachments/${attachment.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm font-medium text-primary hover:underline"
                    >
                      {attachment.originalName}
                    </a>
                    <span className="ml-2 text-xs text-on-surface-variant">
                      {formatFileSize(attachment.fileSize)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={formDisabled}
                    onClick={() => void handleDeleteAttachment(attachment.id)}
                    className="ml-3 shrink-0 rounded-md px-3 py-1 text-xs font-medium text-destructive transition hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* --- 제출 버튼 --- */}
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            value="draft"
            disabled={formDisabled}
            className="inline-flex w-full items-center justify-center rounded-lg bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "draft"
              ? "저장 중..."
              : "임시저장"}
          </button>
          <button
            type="submit"
            value="submit"
            disabled={formDisabled}
            className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/10 transition hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "submit"
              ? "제출 중..."
              : "최종 제출"}
          </button>
        </div>
      </form>
    </section>
  );
}
