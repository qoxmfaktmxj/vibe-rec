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
  { value: "REJECTED", label: "보류/불합격" },
];

const inputClassName =
  "mt-2 w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

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
            setMessage(body.message ?? "검토 상태를 변경하지 못했습니다.");
            return;
          }

          setMessage("검토 상태를 저장했습니다.");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("검토 상태 저장 중 예기치 않은 오류가 발생했습니다.");
        } finally {
          setIsPending(false);
        }
      })();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ambient-shadow rounded-xl bg-surface-container-lowest p-7"
    >
      <h2 className="font-headline text-2xl font-bold text-on-surface">
        채용 담당자 검토
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
        제출된 지원서만 검토 대상으로 올릴 수 있습니다. 현재 규칙은{" "}
        <code className="rounded bg-surface-container-high px-1.5 py-0.5 text-xs font-semibold text-on-surface">
          NEW &rarr; IN_REVIEW &rarr; PASSED/REJECTED
        </code>{" "}
        순서입니다.
      </p>

      {message ? (
        <div
          className={`mt-5 rounded-lg px-4 py-3 text-sm ${
            isError
              ? "bg-error-container text-destructive"
              : "bg-secondary-container text-[#00731e]"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <label className="block text-sm font-semibold text-on-surface-variant">
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

        <label className="block text-sm font-semibold text-on-surface-variant">
          검토 메모
          <textarea
            rows={5}
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            disabled={isPending}
            className={`${inputClassName} resize-y`}
            placeholder="검토 메모를 남겨 두면 다음 담당자가 흐름을 이해하기 쉽습니다."
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gradient-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "저장 중..." : "검토 상태 저장"}
      </button>
    </form>
  );
}
