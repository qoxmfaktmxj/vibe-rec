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
  { value: "NEW", label: "?좉퇋", description: "?꾩쭅 寃?좉? ?쒖옉?섏? ?딆븯?듬땲??" },
  {
    value: "IN_REVIEW",
    label: "寃??以?,
    description: "?꾩옱 吏?먯꽌瑜?寃?좏븯怨??덉뒿?덈떎.",
  },
  {
    value: "PASSED",
    label: "?⑷꺽",
    description: "吏?먯옄瑜??ㅼ쓬 ?④퀎濡?吏꾪뻾?????덉뒿?덈떎.",
  },
  {
    value: "REJECTED",
    label: "遺덊빀寃?,
    description: "吏?먯옄?????댁긽 ?ㅼ쓬 ?④퀎濡?吏꾪뻾?섏? ?딆뒿?덈떎.",
  },
];

const inputClassName =
  "mt-2 w-full rounded-xl border border-outline-variant bg-card px-4 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary";

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

  const selectedOption =
    reviewOptions.find((option) => option.value === reviewStatus) ??
    reviewOptions[0];
  const hasExistingNote = (applicant.reviewNote ?? "").trim().length > 0;

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
            setMessage(body.message ?? "寃???곹깭瑜?蹂寃쏀븯吏 紐삵뻽?듬땲??");
            return;
          }

          setMessage("寃???곹깭瑜???ν뻽?듬땲??");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("?ㅽ듃?뚰겕 ?ㅻ쪟濡?寃???곹깭瑜???ν븯吏 紐삵뻽?듬땲??");
        } finally {
          setIsPending(false);
        }
      })();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-card p-7"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
        寃??愿由?
      </p>
      <h2 className="mt-3 font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
        吏???곹깭瑜?紐낇솗?섍쾶 愿由ы븯?몄슂
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">
        寃???뺤콉??留욎떠 ?쒖꽌?濡?吏꾪뻾?섍퀬, ?ㅼ쓬 ?대떦?먭? 諛붾줈 ?댄빐?????덇쾶
        硫붾え瑜??④꺼 二쇱꽭??
      </p>

      <div className="mt-5 rounded-2xl border border-outline-variant/70 bg-surface-container-low px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            ?꾩옱 ?곹깭
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
        <p className="mt-3 text-lg font-semibold text-on-surface">
          {selectedOption.label}
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">
          {selectedOption.description}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              寃???쒓컖
            </dt>
            <dd className="mt-1 text-sm text-on-surface">
              {formatDateTime(applicant.reviewedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              理쒖쥌 寃곗젙
            </dt>
            <dd className="mt-1 text-sm text-on-surface">
              {applicant.finalStatus
                ? getFinalStatusLabel(applicant.finalStatus)
                : "誘몄젙"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 rounded-2xl border border-outline-variant/70 bg-surface-container-low px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            理쒓렐 寃??硫붾え
          </p>
          {hasExistingNote ? (
            <span className="text-xs text-outline">
              ?ㅼ쓬 ?대떦?먯뿉寃??쒖떆??
            </span>
          ) : null}
        </div>
        {hasExistingNote ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-on-surface">
            {applicant.reviewNote}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            ?꾩쭅 寃??硫붾え媛 ?놁뒿?덈떎. ?곹깭 蹂寃??댁쑀? ?ㅼ쓬 ?≪뀡??吏㏐쾶
            ?④꺼 二쇱꽭??
          </p>
        )}
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
          寃???곹깭
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
          寃??硫붾え
          <textarea
            rows={5}
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            disabled={isPending}
            aria-describedby="review-note-help"
            className={`${inputClassName} resize-y`}
            placeholder="?ㅼ쓬 ?대떦?먭? 諛붾줈 ?댄빐?????덈뒗 ?듭떖 留λ씫???④꺼 二쇱꽭??"
          />
          <p
            id="review-note-help"
            className="mt-2 text-xs font-normal leading-6 text-on-surface-variant"
          >
            ?먮떒 洹쇨굅, ?⑥? ?곕젮?ы빆, ?ㅼ쓬 吏꾪뻾 ?ы빆??媛꾨떒???뺣━?섏꽭??
          </p>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "???以?.." : "寃???곹깭 ???}
      </button>
    </form>
  );
}

