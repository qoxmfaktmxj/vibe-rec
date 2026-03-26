"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  EvaluationResult,
  InterviewResponse,
  InterviewStatus,
  JobPostingStep,
} from "@/entities/recruitment/model";
import {
  formatDateTime,
  getEvaluationResultClassName,
  getEvaluationResultLabel,
  getInterviewStatusClassName,
  getInterviewStatusLabel,
  getStepTypeLabel,
} from "@/shared/lib/recruitment";

interface InterviewSectionProps {
  applicationId: number;
  interviews: InterviewResponse[];
  steps: JobPostingStep[];
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

const evaluationResultOptions: Array<{
  value: EvaluationResult;
  label: string;
}> = [
  { value: "PASS", label: "?⑷꺽" },
  { value: "FAIL", label: "遺덊빀寃? },
  { value: "HOLD", label: "蹂대쪟" },
];

export function InterviewSection({
  applicationId,
  interviews,
  steps,
}: InterviewSectionProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const [newJobPostingStepId, setNewJobPostingStepId] = useState<number | "">(
    "",
  );
  const [newScheduledAt, setNewScheduledAt] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isAddingInterview, setIsAddingInterview] = useState(false);

  const [evalFormOpen, setEvalFormOpen] = useState<number | null>(null);
  const [evalScore, setEvalScore] = useState<number>(3);
  const [evalResult, setEvalResult] = useState<EvaluationResult>("PASS");
  const [evalComment, setEvalComment] = useState("");
  const [isAddingEval, setIsAddingEval] = useState(false);

  function showMessage(nextMessage: string, error: boolean) {
    setMessage(nextMessage);
    setIsError(error);
  }

  function handleAddInterview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newJobPostingStepId === "") {
      return;
    }

    setIsAddingInterview(true);
    setMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/admin/applicants/${applicationId}/interviews`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jobPostingStepId: newJobPostingStepId,
                scheduledAt: newScheduledAt
                  ? new Date(newScheduledAt).toISOString()
                  : null,
                note: newNote || null,
              }),
            },
          );

          const body = (await response.json()) as { message?: string };
          if (!response.ok) {
            showMessage(
              body.message ?? "硫댁젒 ?쇱젙??異붽??섏? 紐삵뻽?듬땲??",
              true,
            );
            return;
          }

          showMessage("硫댁젒 ?쇱젙??異붽??덉뒿?덈떎.", false);
          setShowAddForm(false);
          setNewJobPostingStepId("");
          setNewScheduledAt("");
          setNewNote("");
          router.refresh();
        } catch {
          showMessage("?ㅽ듃?뚰겕 ?ㅻ쪟濡?硫댁젒 ?쇱젙??異붽??섏? 紐삵뻽?듬땲??", true);
        } finally {
          setIsAddingInterview(false);
        }
      })();
    });
  }

  function handleUpdateStatus(interviewId: number, status: InterviewStatus) {
    setMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/admin/applicants/${applicationId}/interviews/${interviewId}/status`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            },
          );

          const body = (await response.json()) as { message?: string };
          if (!response.ok) {
            showMessage(
              body.message ?? "硫댁젒 ?곹깭瑜?蹂寃쏀븯吏 紐삵뻽?듬땲??",
              true,
            );
            return;
          }

          showMessage("硫댁젒 ?곹깭瑜???ν뻽?듬땲??", false);
          router.refresh();
        } catch {
          showMessage("?ㅽ듃?뚰겕 ?ㅻ쪟濡?硫댁젒 ?곹깭瑜???ν븯吏 紐삵뻽?듬땲??", true);
        }
      })();
    });
  }

  function handleAddEvaluation(
    event: React.FormEvent<HTMLFormElement>,
    interviewId: number,
  ) {
    event.preventDefault();
    setIsAddingEval(true);
    setMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/admin/applicants/${applicationId}/interviews/${interviewId}/evaluations`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                score: evalScore,
                result: evalResult,
                comment: evalComment || null,
              }),
            },
          );

          const body = (await response.json()) as { message?: string };
          if (!response.ok) {
            showMessage(body.message ?? "?됯?瑜???ν븯吏 紐삵뻽?듬땲??", true);
            return;
          }

          showMessage("?됯?瑜???ν뻽?듬땲??", false);
          setEvalFormOpen(null);
          setEvalScore(3);
          setEvalResult("PASS");
          setEvalComment("");
          router.refresh();
        } catch {
          showMessage("?ㅽ듃?뚰겕 ?ㅻ쪟濡??됯?瑜???ν븯吏 紐삵뻽?듬땲??", true);
        } finally {
          setIsAddingEval(false);
        }
      })();
    });
  }

  const availableSteps = steps.filter(
    (step): step is JobPostingStep & { id: number } =>
      typeof step.id === "number" && step.stepType === "INTERVIEW",
  );
  const assignedStepIds = new Set(
    interviews.map((interview) => interview.jobPostingStepId),
  );
  const unassignedSteps = availableSteps.filter(
    (step) => !assignedStepIds.has(step.id),
  );
  const timelineItems = [...interviews].sort((left, right) => {
    const leftTime = left.scheduledAt ?? left.createdAt;
    const rightTime = right.scheduledAt ?? right.createdAt;
    return new Date(leftTime).getTime() - new Date(rightTime).getTime();
  });
  const scheduledCount = timelineItems.filter(
    (interview) => interview.status === "SCHEDULED",
  ).length;
  const evaluationCount = timelineItems.reduce(
    (total, interview) => total + interview.evaluations.length,
    0,
  );

  return (
    <section className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
            硫댁젒 ??꾨씪??
          </p>
          <div className="space-y-2">
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
              硫댁젒 ?④퀎瑜??먮쫫??留욎떠 愿由ы븯?몄슂
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              硫댁젒 ?④퀎瑜??쇱젙??留욊쾶 ?깅줉?섍퀬, ?꾨즺 ?꾩뿉???됯?瑜??④꺼 ?ㅼ쓬
              ?섏궗寃곗젙源뚯? ?먯뿰?ㅻ읇寃??곌껐?섏꽭??
            </p>
          </div>
        </div>

        {unassignedSteps.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAddForm((current) => !current)}
            className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
          >
            {showAddForm ? "?낅젰 ?リ린" : "硫댁젒 異붽?"}
          </button>
        ) : null}
      </div>

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

      {showAddForm ? (
        <form
          onSubmit={handleAddInterview}
          className="mt-6 grid gap-4 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-6 xl:grid-cols-[1.1fr_1fr_1.3fr]"
        >
          <label className="block text-sm font-semibold text-on-surface-variant">
            ?꾪삎 ?④퀎
            <select
              value={newJobPostingStepId}
              onChange={(event) =>
                setNewJobPostingStepId(
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
              required
              className={inputClassName}
            >
              <option value="">?④퀎瑜??좏깮?섏꽭??/option>
              {unassignedSteps.map((step) => (
                <option key={step.id} value={step.id}>
                  {step.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            ?덉젙 ?쒓컖
            <input
              type="datetime-local"
              value={newScheduledAt}
              onChange={(event) => setNewScheduledAt(event.target.value)}
              className={inputClassName}
            />
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            ?대? 硫붾え
            <textarea
              rows={2}
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              className={`${inputClassName} resize-y`}
              placeholder="李몄꽍?? 以鍮??ы빆, 誘명똿 留λ씫 ?깆쓣 湲곕줉?섏꽭??"
            />
          </label>

          <button
            type="submit"
            disabled={isAddingInterview}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 xl:col-span-3 xl:w-fit"
          >
            {isAddingInterview ? "???以?.." : "硫댁젒 ???}
          </button>
        </form>
      ) : null}

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <MetricCard
          label="硫댁젒 ?④퀎"
          value={availableSteps.length.toString()}
          description="??怨듦퀬???ㅼ젙??硫댁젒 ?④퀎"
        />
        <MetricCard
          label="吏꾪뻾 ?덉젙"
          value={scheduledCount.toString()}
          description="?꾩쭅 ?꾨즺?섏? ?딆? 硫댁젒"
        />
        <MetricCard
          label="?됯? ??
          value={evaluationCount.toString()}
          description="湲곕줉??硫댁젒 ?됯?"
        />
      </div>

      {timelineItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-6 py-10 text-center">
          <p className="text-sm font-semibold text-on-surface">
            ?꾩쭅 ?깅줉??硫댁젒???놁뒿?덈떎
          </p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            泥?硫댁젒 ?④퀎瑜?異붽??섎㈃ ?댄썑 ?됯? ?먮쫫???④퍡 ?쒖옉?⑸땲??
          </p>
        </div>
      ) : (
        <ol className="mt-8 space-y-6">
          {timelineItems.map((interview, index) => {
            const canAddEvaluation = interview.status === "COMPLETED";

            return (
              <li key={interview.id} className="relative pl-12">
                <span className="absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-xs font-semibold text-on-surface">
                  {index + 1}
                </span>
                {index < timelineItems.length - 1 ? (
                  <span className="absolute left-[15px] top-10 h-[calc(100%+8px)] w-px bg-outline-variant/70" />
                ) : null}

                <div className="rounded-[24px] border border-outline-variant/70 bg-surface-container-low p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface">
                          {interview.stepTitle}
                        </span>
                        <span className="inline-flex rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                          {getStepTypeLabel(
                            interview.stepType as
                              | "DOCUMENT"
                              | "ASSIGNMENT"
                              | "INTERVIEW"
                              | "OFFER",
                          )}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInterviewStatusClassName(
                            interview.status,
                          )}`}
                        >
                          {getInterviewStatusLabel(interview.status)}
                        </span>
                      </div>

                      <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <span className="font-semibold text-on-surface-variant">
                            ?덉젙 ?쒓컖
                          </span>
                          <p className="mt-1 text-on-surface">
                            {interview.scheduledAt
                              ? formatDateTime(interview.scheduledAt)
                              : "誘몄젙"}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-on-surface-variant">
                            ?대? 硫붾え
                          </span>
                          <p className="mt-1 text-on-surface">
                            {interview.note ?? "?묒꽦??硫붾え媛 ?놁뒿?덈떎"}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-on-surface-variant">
                            ?됯? ?곹깭
                          </span>
                          <p className="mt-1 text-on-surface">
                            {interview.evaluations.length > 0
                              ? `${interview.evaluations.length}嫄?湲곕줉??
                              : canAddEvaluation
                                ? "?됯? ?낅젰 媛??
                                : "?꾨즺 ???낅젰 媛??}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest px-4 py-4 xl:min-w-[240px]">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        ?곹깭 蹂寃?
                      </p>
                      {interview.status === "SCHEDULED" ? (
                        <div className="mt-3 grid gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(interview.id, "COMPLETED")
                            }
                            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                          >
                            ?꾨즺 泥섎━
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(interview.id, "CANCELLED")
                              }
                              className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
                            >
                              痍⑥냼
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(interview.id, "NO_SHOW")
                              }
                              className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
                            >
                              ?몄눥
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-semibold text-on-surface">
                            {getInterviewStatusLabel(interview.status)}
                          </p>
                          <p className="text-sm leading-6 text-on-surface-variant">
                            {interview.status === "COMPLETED"
                              ? "?꾨옒?먯꽌 ?됯?瑜?異붽??????덉뒿?덈떎."
                              : "??硫댁젒? 醫낅즺???곹깭?낅땲?? ?ш린?쒕뒗 ???댁긽 ?곹깭瑜?蹂寃쏀븷 ???놁뒿?덈떎."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {interview.evaluations.length > 0 ? (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                        ?됯? ?대젰
                      </h4>
                      <div className="mt-3 space-y-2">
                        {interview.evaluations.map((evaluation) => (
                          <div
                            key={evaluation.id}
                            className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest px-4 py-3 text-sm"
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-semibold text-on-surface">
                                {evaluation.evaluatorName}
                              </span>
                              {evaluation.score !== null ? (
                                <span className="text-on-surface-variant">
                                  ?먯닔 {evaluation.score}/5
                                </span>
                              ) : null}
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getEvaluationResultClassName(
                                  evaluation.result,
                                )}`}
                              >
                                {getEvaluationResultLabel(evaluation.result)}
                              </span>
                              <span className="ml-auto text-xs text-outline">
                                {formatDateTime(evaluation.createdAt)}
                              </span>
                            </div>
                            {evaluation.comment ? (
                              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-on-surface-variant">
                                {evaluation.comment}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {evalFormOpen === interview.id ? (
                    <form
                      onSubmit={(event) =>
                        handleAddEvaluation(event, interview.id)
                      }
                      className="mt-6 space-y-4 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                          ?됯? 異붽?
                        </h4>
                        <p className="text-sm text-on-surface-variant">
                          硫댁젒???앸궃 ???먮떒 洹쇨굅瑜?湲곕줉?섏꽭??
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block text-sm font-semibold text-on-surface-variant">
                          ?먯닔
                          <select
                            value={evalScore}
                            onChange={(event) =>
                              setEvalScore(Number(event.target.value))
                            }
                            className={inputClassName}
                          >
                            {[1, 2, 3, 4, 5].map((score) => (
                              <option key={score} value={score}>
                                {score} / 5
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block text-sm font-semibold text-on-surface-variant">
                          寃곌낵
                          <select
                            value={evalResult}
                            onChange={(event) =>
                              setEvalResult(
                                event.target.value as EvaluationResult,
                              )
                            }
                            className={inputClassName}
                          >
                            {evaluationResultOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="block text-sm font-semibold text-on-surface-variant">
                        肄붾찘??
                        <textarea
                          rows={3}
                          value={evalComment}
                          onChange={(event) => setEvalComment(event.target.value)}
                          className={`${inputClassName} resize-y`}
                          placeholder="?먮떒 洹쇨굅, ?곕젮?ы빆, ?꾩냽 議곗튂瑜??뺣━?섏꽭??"
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={isAddingEval}
                          className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isAddingEval ? "???以?.." : "?됯? ???}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEvalFormOpen(null)}
                          className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
                        >
                          痍⑥냼
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-on-surface-variant">
                        {canAddEvaluation
                          ? "硫댁젒???꾨즺?섏뿀?듬땲?? ?꾩슂?????됯?瑜?異붽??섏꽭??"
                          : "硫댁젒???꾨즺 泥섎━?섍린 ?꾩뿉???됯?瑜??낅젰?????놁뒿?덈떎."}
                      </p>
                      <button
                        type="button"
                        disabled={!canAddEvaluation}
                        onClick={() => {
                          setEvalFormOpen(interview.id);
                          setEvalScore(3);
                          setEvalResult("PASS");
                          setEvalComment("");
                        }}
                        className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ?됯? 異붽?
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-on-surface">{value}</p>
      <p className="mt-1 text-sm leading-6 text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}

