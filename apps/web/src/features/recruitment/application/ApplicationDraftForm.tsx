"use client";

import { startTransition, useState } from "react";

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
  const isPending = pendingAction !== null;
  const isSubmitted = state.currentStatus === "SUBMITTED";

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
