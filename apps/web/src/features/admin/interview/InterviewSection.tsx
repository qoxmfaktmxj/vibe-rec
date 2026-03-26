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
  { value: "PASS", label: "Pass" },
  { value: "FAIL", label: "Fail" },
  { value: "HOLD", label: "Hold" },
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

  const [newJobPostingStepId, setNewJobPostingStepId] = useState<number | "">("");
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

          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          if (!response.ok) {
            showMessage(body?.message ?? "Failed to add the interview.", true);
            return;
          }

          showMessage("Interview scheduled.", false);
          setShowAddForm(false);
          setNewJobPostingStepId("");
          setNewScheduledAt("");
          setNewNote("");
          router.refresh();
        } catch {
          showMessage("A network error occurred while scheduling the interview.", true);
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

          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          if (!response.ok) {
            showMessage(body?.message ?? "Failed to update interview status.", true);
            return;
          }

          showMessage("Interview status updated.", false);
          router.refresh();
        } catch {
          showMessage("A network error occurred while updating interview status.", true);
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

          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          if (!response.ok) {
            showMessage(body?.message ?? "Failed to save the evaluation.", true);
            return;
          }

          showMessage("Evaluation saved.", false);
          setEvalFormOpen(null);
          setEvalScore(3);
          setEvalResult("PASS");
          setEvalComment("");
          router.refresh();
        } catch {
          showMessage("A network error occurred while saving the evaluation.", true);
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

  return (
    <section className="rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
            Interviews
          </p>
          <div className="space-y-2">
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
              Manage interview steps
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              Schedule, complete, and evaluate interviews for this application.
            </p>
          </div>
        </div>

        {unassignedSteps.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAddForm((current) => !current)}
            className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
          >
            {showAddForm ? "Close" : "Add interview"}
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
            Interview step
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
              <option value="">Select a step</option>
              {unassignedSteps.map((step) => (
                <option key={step.id} value={step.id}>
                  {step.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            Scheduled at
            <input
              type="datetime-local"
              value={newScheduledAt}
              onChange={(event) => setNewScheduledAt(event.target.value)}
              className={inputClassName}
            />
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            Note
            <textarea
              rows={2}
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              className={`${inputClassName} resize-y`}
              placeholder="Add an internal note for the interview."
            />
          </label>

          <button
            type="submit"
            disabled={isAddingInterview}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 xl:col-span-3 xl:w-fit"
          >
            {isAddingInterview ? "Saving..." : "Create interview"}
          </button>
        </form>
      ) : null}

      {interviews.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-6 py-10 text-center">
          <p className="text-sm font-semibold text-on-surface">No interviews yet.</p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            Add the first interview step to start tracking evaluation progress.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {interviews.map((interview, index) => {
            const canAddEvaluation = interview.status === "COMPLETED";

            return (
              <div key={interview.id} className="rounded-[24px] border border-outline-variant/70 bg-surface-container-low p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface">
                        Step {index + 1}: {interview.stepTitle}
                      </span>
                      <span className="inline-flex rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                        {getStepTypeLabel(
                          interview.stepType as "DOCUMENT" | "ASSIGNMENT" | "INTERVIEW" | "OFFER",
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
                        <span className="font-semibold text-on-surface-variant">Scheduled at</span>
                        <p className="mt-1 text-on-surface">
                          {interview.scheduledAt ? formatDateTime(interview.scheduledAt) : "Not scheduled"}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-on-surface-variant">Note</span>
                        <p className="mt-1 text-on-surface">{interview.note ?? "No note"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-on-surface-variant">Evaluations</span>
                        <p className="mt-1 text-on-surface">{interview.evaluations.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest px-4 py-4 xl:min-w-[240px]">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      Status actions
                    </p>
                    {interview.status === "SCHEDULED" ? (
                      <div className="mt-3 grid gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(interview.id, "COMPLETED")}
                          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                        >
                          Mark completed
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(interview.id, "CANCELLED")}
                            className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(interview.id, "NO_SHOW")}
                            className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
                          >
                            No show
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-on-surface-variant">
                        This interview is already closed.
                      </p>
                    )}
                  </div>
                </div>

                {interview.evaluations.length > 0 ? (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      Evaluations
                    </h4>
                    <div className="mt-3 space-y-2">
                      {interview.evaluations.map((evaluation) => (
                        <div
                          key={evaluation.id}
                          className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest px-4 py-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-semibold text-on-surface">{evaluation.evaluatorName}</span>
                            {evaluation.score !== null ? (
                              <span className="text-on-surface-variant">Score {evaluation.score}/5</span>
                            ) : null}
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getEvaluationResultClassName(
                                evaluation.result,
                              )}`}
                            >
                              {getEvaluationResultLabel(evaluation.result)}
                            </span>
                            <span className="ml-auto text-xs text-outline">{formatDateTime(evaluation.createdAt)}</span>
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
                  <form onSubmit={(event) => handleAddEvaluation(event, interview.id)} className="mt-6 space-y-4 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-on-surface-variant">
                        Score
                        <select value={evalScore} onChange={(event) => setEvalScore(Number(event.target.value))} className={inputClassName}>
                          {[1, 2, 3, 4, 5].map((score) => (
                            <option key={score} value={score}>
                              {score} / 5
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-sm font-semibold text-on-surface-variant">
                        Result
                        <select value={evalResult} onChange={(event) => setEvalResult(event.target.value as EvaluationResult)} className={inputClassName}>
                          {evaluationResultOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="block text-sm font-semibold text-on-surface-variant">
                      Comment
                      <textarea rows={3} value={evalComment} onChange={(event) => setEvalComment(event.target.value)} className={`${inputClassName} resize-y`} placeholder="Summarize the interview outcome." />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button type="submit" disabled={isAddingEval} className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                        {isAddingEval ? "Saving..." : "Save evaluation"}
                      </button>
                      <button type="button" onClick={() => setEvalFormOpen(null)} className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-on-surface-variant">
                      {canAddEvaluation
                        ? "This interview is complete. Add an evaluation if needed."
                        : "Evaluations can be added after the interview is marked completed."}
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
                      Add evaluation
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
