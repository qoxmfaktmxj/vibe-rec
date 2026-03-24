"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { ApplicationFinalStatus } from "@/entities/recruitment/model";
import {
  formatDateTime,
  getFinalStatusClassName,
  getFinalStatusLabel,
} from "@/shared/lib/recruitment";

interface HiringDecisionSectionProps {
  applicationId: number;
  currentFinalStatus: string | null;
  currentNote: string | null;
  currentDecidedAt: string | null;
  reviewStatus: string;
}

const finalStatusOptions: Array<{
  value: ApplicationFinalStatus;
  label: string;
}> = [
  { value: "OFFER_MADE", label: "오퍼 발송" },
  { value: "ACCEPTED", label: "수락" },
  { value: "DECLINED", label: "거절" },
  { value: "WITHDRAWN", label: "철회" },
];

const inputClassName =
  "mt-2 w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

export function HiringDecisionSection({
  applicationId,
  currentFinalStatus,
  currentNote,
  currentDecidedAt,
  reviewStatus,
}: HiringDecisionSectionProps) {
  const router = useRouter();

  const [finalStatus, setFinalStatus] = useState<ApplicationFinalStatus>(
    (currentFinalStatus as ApplicationFinalStatus) ?? "OFFER_MADE",
  );
  const [note, setNote] = useState(currentNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, setIsPending] = useState(false);

  if (reviewStatus !== "PASSED") {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage(null);
    setIsError(false);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/admin/applicants/${applicationId}/final-decision`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                finalStatus,
                note: note || null,
              }),
            },
          );

          const body = (await response.json()) as { message?: string };
          if (!response.ok) {
            setIsError(true);
            setMessage(body.message ?? "최종 결정을 저장하지 못했습니다.");
            return;
          }

          setMessage("최종 결정을 저장했습니다.");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("최종 결정 저장 중 오류가 발생했습니다.");
        } finally {
          setIsPending(false);
        }
      })();
    });
  }

  return (
    <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
      <h2 className="font-headline text-2xl font-bold text-on-surface">
        최종 결정
      </h2>

      {/* Current Decision Display */}
      {currentFinalStatus ? (
        <div className="mt-5 rounded-xl bg-surface-container-low px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-on-surface-variant">
              현재 상태:
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getFinalStatusClassName(currentFinalStatus as ApplicationFinalStatus)}`}
            >
              {getFinalStatusLabel(
                currentFinalStatus as ApplicationFinalStatus,
              )}
            </span>
            {currentDecidedAt ? (
              <span className="text-xs text-outline">
                {formatDateTime(currentDecidedAt)}
              </span>
            ) : null}
          </div>
          {currentNote ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-on-surface-variant">
              {currentNote}
            </p>
          ) : null}
        </div>
      ) : null}

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

      {/* Decision Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block text-sm font-semibold text-on-surface-variant">
          최종 상태
          <select
            value={finalStatus}
            onChange={(e) =>
              setFinalStatus(e.target.value as ApplicationFinalStatus)
            }
            disabled={isPending}
            className={inputClassName}
          >
            {finalStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-on-surface-variant">
          메모
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending}
            className={`${inputClassName} resize-y`}
            placeholder="최종 결정에 대한 메모를 남겨 주세요."
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "저장 중..." : "최종 결정 저장"}
        </button>
      </form>
    </section>
  );
}
