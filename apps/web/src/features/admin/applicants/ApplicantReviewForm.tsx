"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  AdminApplicantDetail,
  ApplicationReviewStatus,
} from "@/entities/admin/applicant-model";

interface ApplicantReviewFormProps {
  applicant: AdminApplicantDetail;
}

const reviewOptions: Array<{
  value: ApplicationReviewStatus;
  label: string;
}> = [
  { value: "NEW", label: "NEW" },
  { value: "IN_REVIEW", label: "IN_REVIEW" },
  { value: "PASSED", label: "PASSED" },
  { value: "REJECTED", label: "REJECTED" },
];

const inputClassName =
  "mt-2 w-full rounded-sm border border-outline-variant bg-card px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary";

export function ApplicantReviewForm({
  applicant,
}: ApplicantReviewFormProps) {
  const router = useRouter();
  const [reviewStatus, setReviewStatus] = useState<ApplicationReviewStatus>(
    applicant.reviewStatus,
  );
  const [reviewNote, setReviewNote] = useState(applicant.reviewNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, setIsPending] = useState(false);

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

          const body = (await response.json()) as { message?: string };
          if (!response.ok) {
            setIsError(true);
            setMessage(body.message ?? "Unable to update review status.");
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
      className="rounded-sm border border-outline-variant bg-card p-7"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
        Review
      </p>
      <h2 className="mt-3 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
        Recruiting decision
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
        Move the application through the current review rule:
        <code className="ml-2 rounded-sm bg-surface-container-low px-2 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-on-surface">
          NEW → IN_REVIEW → PASSED/REJECTED
        </code>
      </p>

      {message ? (
        <div
          className={`mt-5 rounded-sm px-4 py-3 text-sm ${
            isError
              ? "bg-error-container text-destructive"
              : "bg-secondary-container text-[#7d2a54]"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <label className="block text-sm text-on-surface-variant">
          Review status
          <select
            value={reviewStatus}
            onChange={(event) =>
              setReviewStatus(event.target.value as ApplicationReviewStatus)
            }
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

        <label className="block text-sm text-on-surface-variant">
          Notes
          <textarea
            rows={5}
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            disabled={isPending}
            className={`${inputClassName} resize-y`}
            placeholder="Leave a concise note for the next reviewer."
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save review"}
      </button>
    </form>
  );
}
