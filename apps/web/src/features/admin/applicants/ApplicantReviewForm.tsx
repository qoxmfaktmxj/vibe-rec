"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  AdminApplicantDetail,
  ApplicationReviewStatus,
} from "@/entities/admin/applicant-model";
import {
  formatDateTime,
  getApplicationReviewStatusClassName,
  getApplicationReviewStatusLabel,
  getFinalStatusClassName,
  getFinalStatusLabel,
} from "@/shared/lib/recruitment";

interface ApplicantReviewFormProps {
  applicant: AdminApplicantDetail;
}

const reviewOptions: Array<{
  value: ApplicationReviewStatus;
  label: string;
  description: string;
}> = [
  { value: "NEW", label: "New", description: "The review has not started yet." },
  {
    value: "IN_REVIEW",
    label: "In review",
    description: "The recruiting team is reviewing this application.",
  },
  {
    value: "PASSED",
    label: "Passed",
    description: "The applicant can move to the next stage.",
  },
  {
    value: "REJECTED",
    label: "Rejected",
    description: "The application will not move forward.",
  },
];

const inputClassName =
  "mt-2 w-full rounded-xl border border-outline-variant bg-card px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

export function ApplicantReviewForm({ applicant }: ApplicantReviewFormProps) {
  const router = useRouter();
  const [reviewStatus, setReviewStatus] = useState<ApplicationReviewStatus>(
    applicant.reviewStatus,
  );
  const [reviewNote, setReviewNote] = useState(applicant.reviewNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const selectedOption =
    reviewOptions.find((option) => option.value === reviewStatus) ??
    reviewOptions[0];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage(null);
    setIsError(false);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/admin/applicants/${applicant.applicationId}/review-status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reviewStatus,
                reviewNote,
              }),
            },
          );

          const body = (await response.json().catch(() => null)) as {
            message?: string;
          } | null;
          if (!response.ok) {
            setIsError(true);
            setMessage(body?.message ?? "Failed to update review status.");
            return;
          }

          setMessage("Review status updated.");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("A network error occurred while updating review status.");
        } finally {
          setIsPending(false);
        }
      })();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-outline-variant/70 bg-card p-7"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
        Review control
      </p>
      <h2 className="mt-3 font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
        Manage review status
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
        Keep a short note with the status so the next admin can understand the reasoning immediately.
      </p>

      <div className="mt-5 rounded-2xl border border-outline-variant/70 bg-surface-container-low px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            Current status
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getApplicationReviewStatusClassName(
              applicant.reviewStatus,
            )}`}
          >
            {getApplicationReviewStatusLabel(applicant.reviewStatus)}
          </span>
          {applicant.finalStatus ? (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getFinalStatusClassName(
                applicant.finalStatus,
              )}`}
            >
              {getFinalStatusLabel(applicant.finalStatus)}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-lg font-semibold text-on-surface">{selectedOption.label}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{selectedOption.description}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Reviewed at
            </dt>
            <dd className="mt-1 text-sm text-on-surface">
              {formatDateTime(applicant.reviewedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Final outcome
            </dt>
            <dd className="mt-1 text-sm text-on-surface">
              {applicant.finalStatus ? getFinalStatusLabel(applicant.finalStatus) : "Pending"}
            </dd>
          </div>
        </dl>
      </div>

      {message ? (
        <div
          role="alert"
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${
            isError
              ? "bg-error-container text-destructive"
              : "bg-secondary-container text-[#7d2a54]"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <label className="block text-sm font-semibold text-on-surface-variant">
          Review status
          <select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value as ApplicationReviewStatus)}
            disabled={isPending}
            className={inputClassName}
          >
            {reviewOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-on-surface-variant">
          Review note
          <textarea
            rows={5}
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            disabled={isPending}
            className={`${inputClassName} resize-y`}
            placeholder="Summarize the reasoning for this review status."
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save review status"}
      </button>
    </form>
  );
}
