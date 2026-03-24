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
  "mt-2 w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

const interviewStatusOptions: Array<{
  value: InterviewStatus;
  label: string;
}> = [
  { value: "SCHEDULED", label: "예정" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELLED", label: "취소" },
  { value: "NO_SHOW", label: "불참" },
];

const evaluationResultOptions: Array<{
  value: EvaluationResult;
  label: string;
}> = [
  { value: "PENDING", label: "대기" },
  { value: "PASS", label: "합격" },
  { value: "FAIL", label: "불합격" },
  { value: "HOLD", label: "보류" },
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

  // Add interview form state
  const [newJobPostingStepId, setNewJobPostingStepId] = useState<number | "">(
    "",
  );
  const [newScheduledAt, setNewScheduledAt] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isAddingInterview, setIsAddingInterview] = useState(false);

  // Evaluation form state per interview
  const [evalFormOpen, setEvalFormOpen] = useState<number | null>(null);
  const [evalScore, setEvalScore] = useState<number>(3);
  const [evalResult, setEvalResult] = useState<EvaluationResult>("PENDING");
  const [evalComment, setEvalComment] = useState("");
  const [isAddingEval, setIsAddingEval] = useState(false);

  function showMessage(msg: string, error: boolean) {
    setMessage(msg);
    setIsError(error);
  }

  function handleAddInterview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newJobPostingStepId === "") return;

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
              body.message ?? "면접 일정을 등록하지 못했습니다.",
              true,
            );
            return;
          }

          showMessage("면접 일정을 등록했습니다.", false);
          setShowAddForm(false);
          setNewJobPostingStepId("");
          setNewScheduledAt("");
          setNewNote("");
          router.refresh();
        } catch {
          showMessage("면접 등록 중 오류가 발생했습니다.", true);
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
              body.message ?? "면접 상태를 변경하지 못했습니다.",
              true,
            );
            return;
          }

          showMessage("면접 상태를 변경했습니다.", false);
          router.refresh();
        } catch {
          showMessage("면접 상태 변경 중 오류가 발생했습니다.", true);
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
            showMessage(body.message ?? "평가를 등록하지 못했습니다.", true);
            return;
          }

          showMessage("평가를 등록했습니다.", false);
          setEvalFormOpen(null);
          setEvalScore(3);
          setEvalResult("PENDING");
          setEvalComment("");
          router.refresh();
        } catch {
          showMessage("평가 등록 중 오류가 발생했습니다.", true);
        } finally {
          setIsAddingEval(false);
        }
      })();
    });
  }

  // Find steps not yet assigned to an interview
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
    <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-headline text-2xl font-bold text-on-surface">
          면접 타임라인
        </h2>
        {unassignedSteps.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
          >
            {showAddForm ? "취소" : "면접 추가"}
          </button>
        ) : null}
      </div>

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

      {/* Add Interview Form */}
      {showAddForm ? (
        <form
          onSubmit={handleAddInterview}
          className="mt-6 space-y-4 rounded-xl bg-surface-container-low p-6"
        >
          <h3 className="text-sm font-semibold text-on-surface-variant">
            새 면접 등록
          </h3>

          <label className="block text-sm font-semibold text-on-surface-variant">
            전형 단계
            <select
              value={newJobPostingStepId}
              onChange={(e) =>
                setNewJobPostingStepId(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              required
              className={inputClassName}
            >
              <option value="">선택하세요</option>
              {unassignedSteps.map((step) => (
                <option key={step.id} value={step.id}>
                  {step.title} ({getStepTypeLabel(step.stepType)})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            예정 일시
            <input
              type="datetime-local"
              value={newScheduledAt}
              onChange={(e) => setNewScheduledAt(e.target.value)}
              className={inputClassName}
            />
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            메모
            <textarea
              rows={2}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className={`${inputClassName} resize-y`}
              placeholder="면접 관련 메모를 입력하세요."
            />
          </label>

          <button
            type="submit"
            disabled={isAddingInterview}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAddingInterview ? "등록 중..." : "등록"}
          </button>
        </form>
      ) : null}

      {/* Interview Timeline */}
      {interviews.length === 0 ? (
        <p className="mt-6 text-sm text-on-surface-variant">
          등록된 면접 일정이 없습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className="rounded-xl bg-surface-container-low p-6"
            >
              {/* Interview Header */}
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
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInterviewStatusClassName(interview.status)}`}
                >
                  {getInterviewStatusLabel(interview.status)}
                </span>
              </div>

              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <span className="font-semibold text-on-surface-variant">
                    예정 일시:{" "}
                  </span>
                  <span className="text-on-surface">
                    {interview.scheduledAt
                      ? formatDateTime(interview.scheduledAt)
                      : "-"}
                  </span>
                </div>
                {interview.note ? (
                  <div>
                    <span className="font-semibold text-on-surface-variant">
                      메모:{" "}
                    </span>
                    <span className="text-on-surface">{interview.note}</span>
                  </div>
                ) : null}
              </div>

              {/* Status Change */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-on-surface-variant">
                  상태 변경
                  <select
                    value={interview.status}
                    onChange={(e) =>
                      handleUpdateStatus(
                        interview.id,
                        e.target.value as InterviewStatus,
                      )
                    }
                    className="ml-3 rounded-lg border-none bg-surface-container-highest px-3 py-1.5 text-xs text-on-surface outline-none"
                  >
                    {interviewStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Evaluations */}
              {interview.evaluations.length > 0 ? (
                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-on-surface-variant">
                    평가 목록
                  </h4>
                  <div className="mt-2 space-y-2">
                    {interview.evaluations.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-container-lowest px-4 py-3 text-sm"
                      >
                        <span className="font-semibold text-on-surface">
                          {ev.evaluatorName}
                        </span>
                        {ev.score !== null ? (
                          <span className="text-on-surface-variant">
                            점수: {ev.score}/5
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getEvaluationResultClassName(ev.result)}`}
                        >
                          {getEvaluationResultLabel(ev.result)}
                        </span>
                        {ev.comment ? (
                          <span className="text-on-surface-variant">
                            {ev.comment}
                          </span>
                        ) : null}
                        <span className="ml-auto text-xs text-outline">
                          {formatDateTime(ev.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Add Evaluation */}
              {evalFormOpen === interview.id ? (
                <form
                  onSubmit={(e) => handleAddEvaluation(e, interview.id)}
                  className="mt-4 space-y-3 rounded-lg bg-surface-container-lowest p-4"
                >
                  <h4 className="text-sm font-semibold text-on-surface-variant">
                    평가 추가
                  </h4>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block text-sm font-semibold text-on-surface-variant">
                      점수
                      <select
                        value={evalScore}
                        onChange={(e) => setEvalScore(Number(e.target.value))}
                        className={inputClassName}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <option key={s} value={s}>
                            {s}점
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm font-semibold text-on-surface-variant">
                      결과
                      <select
                        value={evalResult}
                        onChange={(e) =>
                          setEvalResult(e.target.value as EvaluationResult)
                        }
                        className={inputClassName}
                      >
                        {evaluationResultOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block text-sm font-semibold text-on-surface-variant">
                    코멘트
                    <textarea
                      rows={2}
                      value={evalComment}
                      onChange={(e) => setEvalComment(e.target.value)}
                      className={`${inputClassName} resize-y`}
                      placeholder="평가 코멘트를 입력하세요."
                    />
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isAddingEval}
                      className="inline-flex items-center justify-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAddingEval ? "등록 중..." : "평가 등록"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvalFormOpen(null)}
                      className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEvalFormOpen(interview.id);
                    setEvalScore(3);
                    setEvalResult("PENDING");
                    setEvalComment("");
                  }}
                  className="mt-4 rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
                >
                  평가 추가
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
