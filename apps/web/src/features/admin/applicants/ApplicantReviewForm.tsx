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
  "mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

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
      className="rounded-[2rem] border border-black/8 bg-white/88 p-7 shadow-[0_24px_80px_rgba(43,35,18,0.08)]"
    >
      <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
        Recruiter Review
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
        검토 상태 변경
      </h2>
      <p className="mt-3 text-sm leading-7 text-stone-600">
        제출된 지원서만 검토 대상으로 올릴 수 있습니다. 현재 규칙은{" "}
        <code className="rounded bg-stone-100 px-1 py-0.5 text-xs text-stone-800">
          NEW -&gt; IN_REVIEW -&gt; PASSED/REJECTED
        </code>{" "}
        순서입니다.
      </p>

      {message ? (
        <div
          className={`mt-5 rounded-[1.5rem] px-4 py-3 text-sm ${
            isError
              ? "bg-rose-100 text-rose-900"
              : "bg-emerald-100 text-emerald-900"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <label className="block text-sm font-medium text-stone-700">
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

        <label className="block text-sm font-medium text-stone-700">
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
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "저장 중..." : "검토 상태 저장"}
      </button>
    </form>
  );
}
