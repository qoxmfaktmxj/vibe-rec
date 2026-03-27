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
  { value: "NEW", label: "접수 대기", description: "아직 심사가 시작되지 않았습니다." },
  {
    value: "IN_REVIEW",
    label: "검토 중",
    description: "채용팀이 해당 지원서를 검토하고 있습니다.",
  },
  {
    value: "PASSED",
    label: "합격",
    description: "지원자가 다음 단계로 진행할 수 있습니다.",
  },
  {
    value: "REJECTED",
    label: "불합격",
    description: "해당 지원서는 더 이상 진행되지 않습니다.",
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
            setMessage(body?.message ?? "심사 상태 업데이트에 실패했습니다.");
            return;
          }

          setMessage("심사 상태가 업데이트되었습니다.");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
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
        심사 관리
      </p>
      <h2 className="mt-3 font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
        심사 상태를 관리합니다
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
        간략한 검토 메모를 남겨주세요. 다음 담당자가 검토 근거를 바로 파악할 수 있습니다.
      </p>

      <div className="mt-5 rounded-2xl border border-outline-variant/70 bg-surface-container-low px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            현재 상태
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
              검토일
            </dt>
            <dd className="mt-1 text-sm text-on-surface">
              {formatDateTime(applicant.reviewedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              최종 결과
            </dt>
            <dd className="mt-1 text-sm text-on-surface">
              {applicant.finalStatus ? getFinalStatusLabel(applicant.finalStatus) : "대기"}
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
          심사 상태
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
          검토 메모
          <textarea
            rows={5}
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            disabled={isPending}
            className={`${inputClassName} resize-y`}
            placeholder="판단 근거를 요약해 주세요..."
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "저장 중..." : "심사 결과 저장"}
      </button>
    </form>
  );
}
