"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { ApplicationReviewStatus } from "@/entities/admin/applicant-model";
import type { ApplicationFinalStatus } from "@/entities/recruitment/model";
import {
  formatDateTime,
  getApplicationReviewStatusLabel,
  getFinalStatusClassName,
  getFinalStatusLabel,
} from "@/shared/lib/recruitment";

interface HiringDecisionSectionProps {
  applicationId: number;
  currentFinalStatus: ApplicationFinalStatus | null;
  currentNote: string | null;
  currentDecidedAt: string | null;
  reviewStatus: ApplicationReviewStatus;
}

const finalStatusOptions: Array<{
  value: ApplicationFinalStatus;
  label: string;
  description: string;
}> = [
  {
    value: "OFFER_MADE",
    label: "泥섏슦 ?쒖븞",
    description: "吏?먯옄?먭쾶 泥섏슦瑜??꾨떖???곹깭?낅땲??",
  },
  {
    value: "ACCEPTED",
    label: "?섎씫",
    description: "吏?먯옄媛 泥섏슦瑜??섎씫?덉뒿?덈떎.",
  },
  {
    value: "DECLINED",
    label: "嫄곗젅",
    description: "吏?먯옄媛 泥섏슦瑜?嫄곗젅?덉뒿?덈떎.",
  },
  {
    value: "WITHDRAWN",
    label: "泥좏쉶",
    description: "吏?먯옄媛 ?꾪삎?먯꽌 泥좏쉶?덉뒿?덈떎.",
  },
];

const inputClassName =
  "mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

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
  const isEligible = reviewStatus === "PASSED";

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
            setMessage(body.message ?? "理쒖쥌 寃곗젙????ν븯吏 紐삵뻽?듬땲??");
            return;
          }

          setMessage("理쒖쥌 寃곗젙????ν뻽?듬땲??");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("?ㅽ듃?뚰겕 ?ㅻ쪟濡?理쒖쥌 寃곗젙????ν븯吏 紐삵뻽?듬땲??");
        } finally {
          setIsPending(false);
        }
      })();
    });
  }

  const selectedOption =
    finalStatusOptions.find((option) => option.value === finalStatus) ??
    finalStatusOptions[0];

  return (
    <section className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
            理쒖쥌 寃곗젙
          </p>
          <div className="space-y-2">
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
              理쒖쥌 寃곌낵瑜?紐낇솗?섍쾶 ?④린?몄슂
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              寃?좉? ?⑷꺽 ?곹깭媛 ?섎㈃ 理쒖쥌 寃곗젙???????덉뒿?덈떎. ?댄썑 ?곹깭?
              硫붾え瑜?媛숈? ?붾㈃?먯꽌 怨꾩냽 ?뺤씤?????덉뒿?덈떎.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low px-5 py-4 xl:w-[320px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            ?좏깮???곹깭
          </p>
          <p className="mt-2 text-lg font-semibold text-on-surface">
            {selectedOption.label}
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {selectedOption.description}
          </p>
        </div>
      </div>

      {!isEligible ? (
        <div className="mt-6 rounded-2xl border border-outline-variant/70 bg-surface-container-low px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            寃곗젙 ?좉툑
          </p>
          <p className="mt-2 text-sm leading-7 text-on-surface">
            理쒖쥌 寃곗젙? 寃???곹깭媛 <span className="font-semibold">?⑷꺽</span>??
            ?뚮쭔 ?섏젙?????덉뒿?덈떎. ?꾩옱 寃???곹깭??" "}
            <span className="font-semibold">
              {getApplicationReviewStatusLabel(reviewStatus)}
            </span>
            ?낅땲??
          </p>
        </div>
      ) : null}

      {currentFinalStatus ? (
        <div className="mt-6 rounded-2xl border border-outline-variant/70 bg-surface-container-low px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-on-surface-variant">
              ?꾩옱 寃곌낵
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
                ????쒓컖 {formatDateTime(currentDecidedAt)}
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
          role="alert"
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${
            isError
              ? "bg-error-container text-destructive"
              : "bg-secondary-container text-[#00731e]"
          }`}
        >
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <label className="block text-sm font-semibold text-on-surface-variant">
          寃곌낵
          <select
            value={finalStatus}
            onChange={(e) =>
              setFinalStatus(e.target.value as ApplicationFinalStatus)
            }
            disabled={isPending || !isEligible}
            className={inputClassName}
          >
            {finalStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-on-surface-variant">
          寃곗젙 硫붾え
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending || !isEligible}
            className={`${inputClassName} resize-y`}
            placeholder="泥섏슦 議곌굔, ?섎씫 諛곌꼍, 醫낅즺 ?ъ쑀 ???꾩슂??留λ씫??湲곕줉?섏꽭??"
          />
        </label>

        <button
          type="submit"
          disabled={isPending || !isEligible}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 xl:col-span-2"
        >
          {isPending
            ? "???以?.."
            : isEligible
              ? "理쒖쥌 寃곗젙 ???
              : "寃???⑷꺽 ?????媛??}
        </button>
      </form>
    </section>
  );
}

