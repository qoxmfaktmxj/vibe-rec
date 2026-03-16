"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type {
  Interview,
  InterviewResult,
  InterviewStatus,
  InterviewType,
} from "@/entities/admin/interview-model";

interface InterviewSectionProps {
  applicationId: number;
  interviews: Interview[];
  canSchedule: boolean;
}

const interviewTypeLabels: Record<InterviewType, string> = {
  PHONE: "전화 면접",
  VIDEO: "화상 면접",
  ONSITE: "대면 면접",
  TECHNICAL: "기술 면접",
};

const statusLabels: Record<InterviewStatus, string> = {
  SCHEDULED: "예정",
  COMPLETED: "완료",
  CANCELLED: "취소",
  NO_SHOW: "불참",
};

const statusClassNames: Record<InterviewStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  NO_SHOW: "bg-red-100 text-red-700",
};

const resultLabels: Record<InterviewResult, string> = {
  PASS: "합격",
  FAIL: "불합격",
  PENDING: "미평가",
};

const resultClassNames: Record<InterviewResult, string> = {
  PASS: "text-green-700",
  FAIL: "text-red-700",
  PENDING: "text-outline",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InterviewSection({
  applicationId,
  interviews,
  canSchedule,
}: InterviewSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    interviewType: "ONSITE" as InterviewType,
    scheduledAt: "",
    durationMinutes: 60,
    location: "",
    onlineLink: "",
    note: "",
  });
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Per-interview state
  const [newEvaluatorNames, setNewEvaluatorNames] = useState<
    Record<number, string>
  >({});
  const [scoreInputs, setScoreInputs] = useState<
    Record<number, { score: string; comment: string; result: InterviewResult }>
  >({});
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleSchedule() {
    setScheduleError(null);
    if (!scheduleForm.scheduledAt) {
      setScheduleError("면접 일시를 입력해 주세요.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/applicants/${applicationId}/interviews`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...scheduleForm,
              scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
              location: scheduleForm.location || undefined,
              onlineLink: scheduleForm.onlineLink || undefined,
              note: scheduleForm.note || undefined,
            }),
          },
        );
        if (!res.ok) {
          const err = (await res.json()) as { message?: string };
          setScheduleError(err.message ?? "면접 등록에 실패했습니다.");
          return;
        }
        setShowScheduleForm(false);
        setScheduleForm({
          interviewType: "ONSITE",
          scheduledAt: "",
          durationMinutes: 60,
          location: "",
          onlineLink: "",
          note: "",
        });
        router.refresh();
      } catch {
        setScheduleError("면접 등록 중 오류가 발생했습니다.");
      }
    });
  }

  async function handleStatusChange(interviewId: number, status: InterviewStatus) {
    setActionError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/interviews/${interviewId}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          },
        );
        if (!res.ok) {
          const err = (await res.json()) as { message?: string };
          setActionError(err.message ?? "상태 변경에 실패했습니다.");
          return;
        }
        router.refresh();
      } catch {
        setActionError("상태 변경 중 오류가 발생했습니다.");
      }
    });
  }

  async function handleAddEvaluator(interviewId: number) {
    const name = newEvaluatorNames[interviewId]?.trim();
    if (!name) return;
    setActionError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/interviews/${interviewId}/evaluators`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ evaluatorName: name }),
          },
        );
        if (!res.ok) {
          const err = (await res.json()) as { message?: string };
          setActionError(err.message ?? "평가자 추가에 실패했습니다.");
          return;
        }
        setNewEvaluatorNames((prev) => ({ ...prev, [interviewId]: "" }));
        router.refresh();
      } catch {
        setActionError("평가자 추가 중 오류가 발생했습니다.");
      }
    });
  }

  async function handleRemoveEvaluator(interviewId: number, evaluatorId: number) {
    setActionError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/interviews/${interviewId}/evaluators/${evaluatorId}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const err = (await res.json()) as { message?: string };
          setActionError(err.message ?? "평가자 삭제에 실패했습니다.");
          return;
        }
        router.refresh();
      } catch {
        setActionError("평가자 삭제 중 오류가 발생했습니다.");
      }
    });
  }

  async function handleSubmitScore(interviewId: number, evaluatorId: number) {
    const input = scoreInputs[evaluatorId];
    if (!input?.score || !input.result || input.result === "PENDING") {
      setActionError("점수와 결과를 모두 입력해 주세요.");
      return;
    }
    setActionError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/interviews/${interviewId}/evaluators/${evaluatorId}/score`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              score: Number(input.score),
              comment: input.comment || undefined,
              result: input.result,
            }),
          },
        );
        if (!res.ok) {
          const err = (await res.json()) as { message?: string };
          setActionError(err.message ?? "평가 제출에 실패했습니다.");
          return;
        }
        setScoreInputs((prev) => {
          const next = { ...prev };
          delete next[evaluatorId];
          return next;
        });
        router.refresh();
      } catch {
        setActionError("평가 제출 중 오류가 발생했습니다.");
      }
    });
  }

  const inputCls =
    "w-full rounded-lg border-none bg-surface-container-highest px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";
  const btnPrimaryCls =
    "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
  const btnSecCls =
    "rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-50";

  return (
    <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-headline text-2xl font-bold text-on-surface">
          면접 일정
          <span className="ml-2 text-base font-normal text-outline">
            {interviews.length}건
          </span>
        </h2>
        {canSchedule ? (
          <button
            type="button"
            disabled={isPending}
            className={btnSecCls}
            onClick={() => setShowScheduleForm((v) => !v)}
          >
            {showScheduleForm ? "취소" : "+ 면접 등록"}
          </button>
        ) : null}
      </div>

      {!canSchedule ? (
        <p className="mt-4 text-sm text-outline">
          검토 결과가 <strong>합격(PASSED)</strong>인 지원자에게만 면접을
          배정할 수 있습니다.
        </p>
      ) : null}

      {/* Schedule Form */}
      {showScheduleForm ? (
        <div className="mt-6 space-y-3 rounded-xl bg-surface-container-low p-5">
          <h3 className="text-sm font-semibold text-on-surface-variant">
            면접 등록
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                면접 유형
              </label>
              <select
                className={inputCls}
                value={scheduleForm.interviewType}
                onChange={(e) =>
                  setScheduleForm((f) => ({
                    ...f,
                    interviewType: e.target.value as InterviewType,
                  }))
                }
              >
                {(
                  Object.entries(interviewTypeLabels) as [
                    InterviewType,
                    string,
                  ][]
                ).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                면접 일시 *
              </label>
              <input
                type="datetime-local"
                className={inputCls}
                value={scheduleForm.scheduledAt}
                onChange={(e) =>
                  setScheduleForm((f) => ({
                    ...f,
                    scheduledAt: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                소요 시간 (분)
              </label>
              <input
                type="number"
                min={15}
                className={inputCls}
                value={scheduleForm.durationMinutes}
                onChange={(e) =>
                  setScheduleForm((f) => ({
                    ...f,
                    durationMinutes: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                장소
              </label>
              <input
                type="text"
                className={inputCls}
                placeholder="예: 3층 회의실"
                value={scheduleForm.location}
                onChange={(e) =>
                  setScheduleForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                온라인 링크
              </label>
              <input
                type="url"
                className={inputCls}
                placeholder="https://..."
                value={scheduleForm.onlineLink}
                onChange={(e) =>
                  setScheduleForm((f) => ({
                    ...f,
                    onlineLink: e.target.value,
                  }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                메모
              </label>
              <textarea
                rows={2}
                className={`resize-y ${inputCls}`}
                value={scheduleForm.note}
                onChange={(e) =>
                  setScheduleForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </div>
          </div>
          {scheduleError ? (
            <p className="text-xs text-destructive">{scheduleError}</p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isPending}
              className={btnPrimaryCls}
              onClick={handleSchedule}
            >
              면접 등록
            </button>
          </div>
        </div>
      ) : null}

      {actionError ? (
        <p className="mt-3 text-xs text-destructive">{actionError}</p>
      ) : null}

      {/* Interview List */}
      {interviews.length > 0 ? (
        <div className="mt-6 space-y-5">
          {interviews.map((interview) => (
            <div
              key={interview.interviewId}
              className="rounded-xl bg-surface-container-low p-5"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-on-surface">
                  {interviewTypeLabels[interview.interviewType]}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClassNames[interview.status]}`}
                >
                  {statusLabels[interview.status]}
                </span>
                <span className="ml-auto text-xs text-outline">
                  {formatDateTime(interview.scheduledAt)} ·{" "}
                  {interview.durationMinutes}분
                </span>
              </div>

              {interview.location ? (
                <p className="mt-1 text-xs text-on-surface-variant">
                  📍 {interview.location}
                </p>
              ) : null}
              {interview.onlineLink ? (
                <a
                  href={interview.onlineLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-xs text-primary hover:underline"
                >
                  🔗 {interview.onlineLink}
                </a>
              ) : null}
              {interview.note ? (
                <p className="mt-1 text-xs text-on-surface-variant">
                  {interview.note}
                </p>
              ) : null}

              {/* Status change */}
              {interview.status === "SCHEDULED" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    className={btnSecCls}
                    onClick={() =>
                      handleStatusChange(interview.interviewId, "COMPLETED")
                    }
                  >
                    완료 처리
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    className={btnSecCls}
                    onClick={() =>
                      handleStatusChange(interview.interviewId, "CANCELLED")
                    }
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    className={btnSecCls}
                    onClick={() =>
                      handleStatusChange(interview.interviewId, "NO_SHOW")
                    }
                  >
                    불참 처리
                  </button>
                </div>
              ) : null}

              {/* Evaluators */}
              <div className="mt-4 border-t border-outline/10 pt-4">
                <p className="mb-2 text-xs font-semibold text-on-surface-variant">
                  평가자
                </p>
                {interview.evaluators.length > 0 ? (
                  <div className="space-y-3">
                    {interview.evaluators.map((ev) => (
                      <div
                        key={ev.evaluatorId}
                        className="rounded-lg bg-surface-container-lowest p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-on-surface">
                            {ev.evaluatorName}
                          </span>
                          <div className="flex items-center gap-2">
                            {ev.result !== "PENDING" ? (
                              <span
                                className={`text-xs font-semibold ${resultClassNames[ev.result]}`}
                              >
                                {resultLabels[ev.result]}
                                {ev.score != null
                                  ? ` (${ev.score}/5)`
                                  : ""}
                              </span>
                            ) : null}
                            {ev.result === "PENDING" ? (
                              <button
                                type="button"
                                disabled={isPending}
                                className="text-xs text-outline hover:text-destructive disabled:opacity-50"
                                onClick={() =>
                                  handleRemoveEvaluator(
                                    interview.interviewId,
                                    ev.evaluatorId,
                                  )
                                }
                              >
                                삭제
                              </button>
                            ) : null}
                          </div>
                        </div>
                        {ev.comment ? (
                          <p className="mt-1 text-xs text-on-surface-variant">
                            {ev.comment}
                          </p>
                        ) : null}
                        {ev.result === "PENDING" &&
                        interview.status === "COMPLETED" ? (
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              min={1}
                              max={5}
                              placeholder="점수 (1~5)"
                              className={`${inputCls} col-span-1`}
                              value={
                                scoreInputs[ev.evaluatorId]?.score ?? ""
                              }
                              onChange={(e) =>
                                setScoreInputs((prev) => ({
                                  ...prev,
                                  [ev.evaluatorId]: {
                                    ...prev[ev.evaluatorId],
                                    score: e.target.value,
                                    comment:
                                      prev[ev.evaluatorId]?.comment ?? "",
                                    result:
                                      prev[ev.evaluatorId]?.result ??
                                      "PENDING",
                                  },
                                }))
                              }
                            />
                            <select
                              className={`${inputCls} col-span-1`}
                              value={
                                scoreInputs[ev.evaluatorId]?.result ?? "PENDING"
                              }
                              onChange={(e) =>
                                setScoreInputs((prev) => ({
                                  ...prev,
                                  [ev.evaluatorId]: {
                                    ...prev[ev.evaluatorId],
                                    score: prev[ev.evaluatorId]?.score ?? "",
                                    comment:
                                      prev[ev.evaluatorId]?.comment ?? "",
                                    result: e.target.value as InterviewResult,
                                  },
                                }))
                              }
                            >
                              <option value="PENDING">결과 선택</option>
                              <option value="PASS">합격</option>
                              <option value="FAIL">불합격</option>
                            </select>
                            <button
                              type="button"
                              disabled={isPending}
                              className={btnSecCls}
                              onClick={() =>
                                handleSubmitScore(
                                  interview.interviewId,
                                  ev.evaluatorId,
                                )
                              }
                            >
                              제출
                            </button>
                            <textarea
                              rows={2}
                              placeholder="코멘트 (선택)"
                              className={`col-span-3 resize-y ${inputCls}`}
                              value={
                                scoreInputs[ev.evaluatorId]?.comment ?? ""
                              }
                              onChange={(e) =>
                                setScoreInputs((prev) => ({
                                  ...prev,
                                  [ev.evaluatorId]: {
                                    ...prev[ev.evaluatorId],
                                    score: prev[ev.evaluatorId]?.score ?? "",
                                    comment: e.target.value,
                                    result:
                                      prev[ev.evaluatorId]?.result ??
                                      "PENDING",
                                  },
                                }))
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-outline">
                    등록된 평가자가 없습니다.
                  </p>
                )}

                {/* Add evaluator */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="평가자 이름"
                    className={`flex-1 ${inputCls}`}
                    value={newEvaluatorNames[interview.interviewId] ?? ""}
                    onChange={(e) =>
                      setNewEvaluatorNames((prev) => ({
                        ...prev,
                        [interview.interviewId]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleAddEvaluator(interview.interviewId);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={
                      isPending ||
                      !newEvaluatorNames[interview.interviewId]?.trim()
                    }
                    className={btnSecCls}
                    onClick={() => handleAddEvaluator(interview.interviewId)}
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-outline">
          {canSchedule
            ? "아직 등록된 면접 일정이 없습니다. 면접을 등록해 보세요."
            : ""}
        </p>
      )}
    </section>
  );
}
