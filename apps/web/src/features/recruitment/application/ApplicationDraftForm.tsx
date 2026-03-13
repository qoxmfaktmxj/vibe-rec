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

const inputClassName =
  "mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-primary focus:ring-4 focus:ring-primary/10";

const initialFormValues: DraftFormValues = {
  applicantName: "",
  applicantEmail: "",
  applicantPhone: "",
  introduction: "",
  coreStrength: "",
  careerYears: "",
};

function validateDraftFields(values: DraftFormValues) {
  const fieldErrors: DraftActionState["fieldErrors"] = {};

  if (values.applicantName.trim().length < 2) {
    fieldErrors.applicantName = "Enter at least two characters for the name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.applicantEmail.trim())) {
    fieldErrors.applicantEmail = "Enter a valid email address.";
  }

  if (!/^[0-9+\-() ]{8,40}$/.test(values.applicantPhone.trim())) {
    fieldErrors.applicantPhone = "Enter a valid phone number.";
  }

  if (
    values.introduction.trim() &&
    values.introduction.trim().length < 20
  ) {
    fieldErrors.introduction =
      "Introduction must be at least 20 characters long.";
  }

  if (
    values.careerYears.trim() &&
    (!/^\d+$/.test(values.careerYears.trim()) ||
      Number(values.careerYears.trim()) > 40)
  ) {
    fieldErrors.careerYears =
      "Career years must be a number between 0 and 40.";
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
  const [isPending, setIsPending] = useState(false);

  function updateField(fieldName: DraftFieldName, value: string) {
    setFormValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  async function submitDraft() {
    try {
      const response = await fetch(
        `/api/job-postings/${jobPostingId}/application-draft`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
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
          }),
        },
      );

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
          message: errorMessage ?? "Failed to save the application draft.",
          fieldErrors: {},
          savedAt: null,
          applicationId: null,
        });
        return;
      }

      if (!("applicantEmail" in responseBody)) {
        setState({
          status: "error",
          message: "The save response did not contain draft details.",
          fieldErrors: {},
          savedAt: null,
          applicationId: null,
        });
        return;
      }

      setState({
        status: "success",
        message: `Draft saved for ${responseBody.applicantEmail}.`,
        fieldErrors: {},
        savedAt: responseBody.draftSavedAt,
        applicationId: responseBody.applicationId,
      });
    } catch {
      setState({
        status: "error",
        message: "An unexpected error occurred while saving the draft.",
        fieldErrors: {},
        savedAt: null,
        applicationId: null,
      });
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fieldErrors = validateDraftFields(formValues);
    if (Object.keys(fieldErrors).length > 0) {
      setState({
        status: "error",
        message: "Review the highlighted fields and try again.",
        fieldErrors,
        savedAt: null,
        applicationId: null,
      });
      return;
    }

    setIsPending(true);
    setState((current) => ({
      ...current,
      status: "idle",
      message: null,
      fieldErrors: {},
    }));

    startTransition(() => {
      void submitDraft();
    });
  }

  return (
    <section className="rounded-[2rem] border border-black/8 bg-white/88 p-7 shadow-[0_24px_80px_rgba(43,35,18,0.1)]">
      <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
        Application Draft
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
        Save draft
      </h2>
      <p className="mt-3 text-sm leading-7 text-stone-600">{helperText}</p>

      {state.message ? (
        <div
          className={`mt-5 rounded-[1.5rem] px-4 py-3 text-sm ${
            state.status === "success"
              ? "bg-emerald-100 text-emerald-900"
              : "bg-rose-100 text-rose-900"
          }`}
        >
          <p>{state.message}</p>
          {state.status === "success" && state.savedAt ? (
            <p className="mt-2 text-xs">
              Status: {getApplicationStatusLabel("DRAFT")} | Saved at:{" "}
              {formatDateTime(state.savedAt)}
              {state.applicationId ? ` | application #${state.applicationId}` : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {!canSave ? (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-100 px-4 py-4 text-sm text-stone-600">
          Draft save is disabled because the posting window is not active.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5">
          <label className="block text-sm font-medium text-stone-700">
            Applicant name
            <input
              name="applicantName"
              type="text"
              autoComplete="name"
              placeholder="Kim Recruit"
              required
              minLength={2}
              disabled={!canSave || isPending}
              aria-invalid={Boolean(state.fieldErrors.applicantName)}
              className={inputClassName}
              value={formValues.applicantName}
              onChange={(event) =>
                updateField("applicantName", event.target.value)
              }
            />
            {state.fieldErrors.applicantName ? (
              <span className="mt-2 block text-xs text-rose-700">
                {state.fieldErrors.applicantName}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Email
            <input
              name="applicantEmail"
              type="email"
              autoComplete="email"
              placeholder="applicant@example.com"
              required
              disabled={!canSave || isPending}
              aria-invalid={Boolean(state.fieldErrors.applicantEmail)}
              className={inputClassName}
              value={formValues.applicantEmail}
              onChange={(event) =>
                updateField("applicantEmail", event.target.value)
              }
            />
            {state.fieldErrors.applicantEmail ? (
              <span className="mt-2 block text-xs text-rose-700">
                {state.fieldErrors.applicantEmail}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Phone
            <input
              name="applicantPhone"
              type="tel"
              autoComplete="tel"
              placeholder="010-1234-5678"
              required
              disabled={!canSave || isPending}
              aria-invalid={Boolean(state.fieldErrors.applicantPhone)}
              className={inputClassName}
              value={formValues.applicantPhone}
              onChange={(event) =>
                updateField("applicantPhone", event.target.value)
              }
            />
            {state.fieldErrors.applicantPhone ? (
              <span className="mt-2 block text-xs text-rose-700">
                {state.fieldErrors.applicantPhone}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Introduction
            <textarea
              name="introduction"
              rows={5}
              placeholder="Summarize relevant experience and motivation."
              disabled={!canSave || isPending}
              aria-invalid={Boolean(state.fieldErrors.introduction)}
              className={`${inputClassName} resize-y`}
              value={formValues.introduction}
              onChange={(event) =>
                updateField("introduction", event.target.value)
              }
            />
            {state.fieldErrors.introduction ? (
              <span className="mt-2 block text-xs text-rose-700">
                {state.fieldErrors.introduction}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Core strength
            <textarea
              name="coreStrength"
              rows={4}
              placeholder="Describe the strongest capability you bring to this role."
              disabled={!canSave || isPending}
              className={`${inputClassName} resize-y`}
              value={formValues.coreStrength}
              onChange={(event) =>
                updateField("coreStrength", event.target.value)
              }
            />
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Career years
            <input
              name="careerYears"
              type="number"
              min={0}
              max={40}
              placeholder="6"
              disabled={!canSave || isPending}
              aria-invalid={Boolean(state.fieldErrors.careerYears)}
              className={inputClassName}
              value={formValues.careerYears}
              onChange={(event) =>
                updateField("careerYears", event.target.value)
              }
            />
            {state.fieldErrors.careerYears ? (
              <span className="mt-2 block text-xs text-rose-700">
                {state.fieldErrors.careerYears}
              </span>
            ) : null}
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSave || isPending}
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving draft..." : "Save application draft"}
        </button>
      </form>
    </section>
  );
}
