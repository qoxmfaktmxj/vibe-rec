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
  { value: "NEW", label: "신규" },
  { value: "IN_REVIEW", label: "검토 중" },
  { value: "PASSED", label: "통과" },
  { value: "REJECTED", label: "불합격" },
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
            setMessage(body.message ?? "검토 상태를 업데이트하지 못했습니다.");
            return;
          }

          setMessage("검토 상태를 업데이트했습니다.");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("검토 상태 저장 중 네트워크 오류가 발생했습니다.");
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
        검토
      </p>
      <h2 className="mt-3 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
        채용 검토 결정
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
        현재 검토 규칙에 따라 지원 상태를 이동합니다:
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
          검토 상태
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
          메모
          <textarea
            rows={5}
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            disabled={isPending}
            className={`${inputClassName} resize-y`}
            placeholder="다음 검토자를 위한 간단한 메모를 남겨 주세요."
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "저장 중..." : "검토 저장"}
      </button>
    </form>
  );
}
