"use client";

import { startTransition, useRef, useState } from "react";

import type { AttachmentSummary } from "@/entities/recruitment/attachment-model";
import type { ApplicationDraftResponse } from "@/entities/recruitment/model";
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

type FormActionMode = "draft" | "submit";

const inputClassName =
  "w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

const initialFormValues: DraftFormValues = {
  applicantName: "",
  applicantEmail: "",
  applicantPhone: "",
  introduction: "",
  coreStrength: "",
  careerYears: "",
};

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

  const [attachments, setAttachments] = useState<AttachmentSummary[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPending = pendingAction !== null;
  const isSubmitted = state.currentStatus === "SUBMITTED";
  const hasApplicationId = state.applicationId !== null;

  async function handleFileUpload(file: File) {
    if (!state.applicationId) {
      setFileError("파일을 첨부하려면 먼저 지원서를 임시저장해주세요.");
      return;
    }

    if (attachments.length >= 3) {
      setFileError("첨부파일은 최대 3개까지 업로드할 수 있습니다.");
      return;
    }

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("PDF, PNG, JPEG 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("파일 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    setUploadingFile(true);
    setFileError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/applications/${state.applicationId}/attachments`,
        { method: "POST", body: formData },
      );

      const body = (await response.json()) as
        | AttachmentSummary
        | { message?: string };

      if (!response.ok) {
        setFileError(
          "message" in body
            ? (body.message ?? "파일 업로드에 실패했습니다.")
            : "파일 업로드에 실패했습니다.",
        );
        return;
      }

      if ("id" in body) {
        setAttachments((prev) => [...prev, body]);
      }
    } catch {
      setFileError("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleDeleteAttachment(attachmentId: number) {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function updateField(fieldName: DraftFieldName, value: string) {
    setFormValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
              disabled={!canSave || isPending || isSubmitted}
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
              disabled={!canSave || isPending || isSubmitted}
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
              disabled={!canSave || isPending || isSubmitted}
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
              disabled={!canSave || isPending || isSubmitted}
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
              disabled={!canSave || isPending || isSubmitted}
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
              disabled={!canSave || isPending || isSubmitted}
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

        {/* 첨부파일 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-on-surface-variant">
            첨부파일
            <span className="ml-2 font-normal text-outline">
              (PDF, PNG, JPEG / 최대 10MB, 3개)
            </span>
          </p>

          {hasApplicationId && !isSubmitted ? (
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-surface-container-high px-4 py-3 text-sm font-medium text-on-surface transition hover:bg-surface-container-highest">
                <svg
                  className="h-5 w-5 text-outline"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {uploadingFile ? "업로드 중..." : "파일 선택"}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  disabled={uploadingFile || isSubmitted || attachments.length >= 3}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleFileUpload(file);
                    }
                  }}
                />
              </label>
            </div>
          ) : !isSubmitted ? (
            <p className="text-xs text-outline">
              파일을 첨부하려면 먼저 임시저장을 해주세요.
            </p>
          ) : null}

          {fileError ? (
            <p className="text-xs text-destructive">{fileError}</p>
          ) : null}

          {attachments.length > 0 ? (
            <ul className="space-y-2">
              {attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center justify-between rounded-lg bg-surface-container-low px-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <svg
                      className="h-4 w-4 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span className="truncate text-on-surface">
                      {attachment.originalFilename}
                    </span>
                    <span className="shrink-0 text-xs text-outline">
                      {formatFileSize(attachment.fileSizeBytes)}
                    </span>
                  </div>
                  {!isSubmitted ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="ml-2 shrink-0 text-xs text-outline transition hover:text-destructive"
                    >
                      삭제
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            value="draft"
            disabled={!canSave || isPending || isSubmitted}
            className="inline-flex w-full items-center justify-center rounded-lg bg-surface-container-high px-5 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "draft"
              ? "저장 중..."
              : "임시저장"}
          </button>
          <button
            type="submit"
            value="submit"
            disabled={!canSave || isPending || isSubmitted}
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
