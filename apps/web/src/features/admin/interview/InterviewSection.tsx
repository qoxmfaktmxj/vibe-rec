"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  EvaluationResult,
  InterviewResponse,
  InterviewStatus,
  InterviewType,
  JobPostingStep,
  ScorecardCriterion,
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
  scorecardsByStepId: Record<number, ScorecardCriterion[]>;
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

const evaluationResultOptions: Array<{
  value: EvaluationResult;
  label: string;
}> = [
  { value: "PASS", label: "합격" },
  { value: "FAIL", label: "불합격" },
  { value: "HOLD", label: "보류" },
];

const interviewTypeLabels: Record<InterviewType, string> = {
  PHONE: "전화",
  VIDEO: "화상",
  ONSITE: "대면",
  TECHNICAL: "기술 면접",
};

export function InterviewSection({
  applicationId,
  interviews,
  steps,
  scorecardsByStepId,
}: InterviewSectionProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const [newJobPostingStepId, setNewJobPostingStepId] = useState<number | "">("");
  const [newInterviewType, setNewInterviewType] = useState<InterviewType>("VIDEO");
  const [newScheduledAt, setNewScheduledAt] = useState("");
  const [newDurationMinutes, setNewDurationMinutes] = useState(60);
  const [newLocation, setNewLocation] = useState("");
  const [newOnlineLink, setNewOnlineLink] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isAddingInterview, setIsAddingInterview] = useState(false);

  const [evalFormOpen, setEvalFormOpen] = useState<number | null>(null);
  const [evalScores, setEvalScores] = useState<Record<number, number>>({});
  const [evalCriterionComments, setEvalCriterionComments] = useState<Record<number, string>>({});
  const [evalResult, setEvalResult] = useState<EvaluationResult>("PASS");
  const [evalComment, setEvalComment] = useState("");
  const [isAddingEval, setIsAddingEval] = useState(false);

  function showMessage(nextMessage: string, error: boolean) {
    setMessage(nextMessage);
    setIsError(error);
  }

  function handleAddInterview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newJobPostingStepId === "" || !newScheduledAt) {
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
                interviewType: newInterviewType,
                scheduledAt: new Date(newScheduledAt).toISOString(),
                durationMinutes: newDurationMinutes,
                location: newLocation || null,
                onlineLink: newOnlineLink || null,
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
          setNewInterviewType("VIDEO");
          setNewScheduledAt("");
          setNewDurationMinutes(60);
          setNewLocation("");
          setNewOnlineLink("");
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
    stepId: number,
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
                criterionScores: (scorecardsByStepId[stepId] ?? []).map((criterion) => ({
                  criterionId: criterion.id,
                  score: evalScores[criterion.id],
                  comment: evalCriterionComments[criterion.id] || null,
                })),
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
          setEvalScores({});
          setEvalCriterionComments({});
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
            면접 관리
          </p>
          <div className="space-y-2">
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
              면접 단계를 관리합니다
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              이 지원서의 면접을 일정 등록, 완료 처리, 평가까지 관리할 수 있습니다.
            </p>
          </div>
        </div>

        {unassignedSteps.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAddForm((current) => !current)}
            className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
          >
            {showAddForm ? "닫기" : "면접 추가"}
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
          className="mt-6 grid gap-4 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-6 md:grid-cols-2"
        >
          <label className="block text-sm font-semibold text-on-surface-variant">
            면접 단계
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
              <option value="">단계를 선택하세요</option>
              {unassignedSteps.map((step) => (
                <option key={step.id} value={step.id}>
                  {step.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            면접 방식
            <select
              value={newInterviewType}
              onChange={(event) => setNewInterviewType(event.target.value as InterviewType)}
              required
              className={inputClassName}
            >
              {Object.entries(interviewTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            일시
            <input
              type="datetime-local"
              value={newScheduledAt}
              onChange={(event) => setNewScheduledAt(event.target.value)}
              required
              className={inputClassName}
            />
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            소요 시간(분)
            <input
              type="number"
              min={15}
              max={480}
              step={15}
              value={newDurationMinutes}
              onChange={(event) => setNewDurationMinutes(Number(event.target.value))}
              required
              className={inputClassName}
            />
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            장소
            <input
              value={newLocation}
              onChange={(event) => setNewLocation(event.target.value)}
              maxLength={300}
              required={newInterviewType === "ONSITE"}
              placeholder="예: 서울 오피스 3층"
              className={inputClassName}
            />
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            온라인 링크
            <input
              type="url"
              value={newOnlineLink}
              onChange={(event) => setNewOnlineLink(event.target.value)}
              maxLength={1000}
              required={newInterviewType === "VIDEO"}
              placeholder="https://..."
              className={inputClassName}
            />
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            메모
            <textarea
              rows={2}
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              className={`${inputClassName} resize-y`}
              placeholder="내부 메모를 남겨주세요..."
            />
          </label>

          <button
            type="submit"
            disabled={isAddingInterview}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 md:w-fit"
          >
            {isAddingInterview ? "저장 중..." : "면접 등록"}
          </button>
        </form>
      ) : null}

      {interviews.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-6 py-10 text-center">
          <p className="text-sm font-semibold text-on-surface">등록된 면접이 없습니다.</p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            첫 번째 면접 단계를 추가하세요.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {interviews.map((interview, index) => {
            const scorecardCriteria = scorecardsByStepId[interview.jobPostingStepId] ?? [];
            const canAddEvaluation = interview.status === "COMPLETED" && scorecardCriteria.length > 0;

            return (
              <div key={interview.id} className="rounded-[24px] border border-outline-variant/70 bg-surface-container-low p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface">
                        {index + 1}단계: {interview.stepTitle}
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
                        <span className="font-semibold text-on-surface-variant">방식</span>
                        <p className="mt-1 text-on-surface">{interviewTypeLabels[interview.interviewType]}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-on-surface-variant">일시</span>
                        <p className="mt-1 text-on-surface">
                          {interview.scheduledAt ? formatDateTime(interview.scheduledAt) : "미정"}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-on-surface-variant">소요 시간</span>
                        <p className="mt-1 text-on-surface">{interview.durationMinutes}분</p>
                      </div>
                      <div>
                        <span className="font-semibold text-on-surface-variant">장소</span>
                        <p className="mt-1 text-on-surface">{interview.location ?? "해당 없음"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-on-surface-variant">온라인 링크</span>
                        <p className="mt-1 break-all text-on-surface">
                          {interview.onlineLink ? (
                            <a href={interview.onlineLink} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
                              링크 열기
                            </a>
                          ) : "해당 없음"}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-on-surface-variant">메모</span>
                        <p className="mt-1 text-on-surface">{interview.note ?? "메모 없음"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-on-surface-variant">평가</span>
                        <p className="mt-1 text-on-surface">{interview.evaluations.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest px-4 py-4 xl:min-w-[240px]">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      상태 변경
                    </p>
                    {interview.status === "SCHEDULED" ? (
                      <div className="mt-3 grid gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(interview.id, "COMPLETED")}
                          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                        >
                          완료 처리
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(interview.id, "CANCELLED")}
                            className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(interview.id, "NO_SHOW")}
                            className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
                          >
                            불참 처리
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-on-surface-variant">
                        이 면접은 이미 종료되었습니다.
                      </p>
                    )}
                  </div>
                </div>

                {interview.evaluations.length > 0 ? (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      평가
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
                              <span className="text-on-surface-variant">점수 {evaluation.score}/5</span>
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
                          {evaluation.criterionScores.length > 0 ? (
                            <dl className="mt-3 grid gap-2 border-t border-outline-variant pt-3 sm:grid-cols-2">
                              {evaluation.criterionScores.map((criterionScore) => (
                                <div key={criterionScore.criterionId}>
                                  <dt className="text-xs text-on-surface-variant">
                                    {criterionScore.criterionName} · 가중치 {criterionScore.weight}
                                  </dt>
                                  <dd className="mt-1 text-sm font-semibold text-on-surface">
                                    {criterionScore.score}/5
                                    {criterionScore.comment ? ` · ${criterionScore.comment}` : ""}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {evalFormOpen === interview.id ? (
                  <form onSubmit={(event) => handleAddEvaluation(event, interview.id, interview.jobPostingStepId)} className="mt-6 space-y-4 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5">
                    <fieldset className="space-y-3">
                      <legend className="text-sm font-semibold text-on-surface">구조화 평가 기준</legend>
                      {(scorecardsByStepId[interview.jobPostingStepId] ?? []).map((criterion) => (
                        <div key={criterion.id} className="grid gap-3 rounded-xl border border-outline-variant bg-card p-4 md:grid-cols-[1fr_150px]">
                          <div>
                            <label htmlFor={`criterion-${interview.id}-${criterion.id}`} className="text-sm font-semibold text-on-surface">
                              {criterion.name}{criterion.required ? " *" : ""}
                            </label>
                            {criterion.description ? <p className="mt-1 text-xs text-on-surface-variant">{criterion.description}</p> : null}
                            <input
                              value={evalCriterionComments[criterion.id] ?? ""}
                              onChange={(event) => setEvalCriterionComments((current) => ({ ...current, [criterion.id]: event.target.value }))}
                              maxLength={1000}
                              placeholder="항목별 근거 메모"
                              className="mt-3 w-full border border-outline-variant px-3 py-2 text-sm"
                            />
                          </div>
                          <label className="text-xs font-semibold text-on-surface-variant">
                            점수 · 가중치 {criterion.weight}
                            <select
                              id={`criterion-${interview.id}-${criterion.id}`}
                              value={evalScores[criterion.id] ?? 3}
                              onChange={(event) => setEvalScores((current) => ({ ...current, [criterion.id]: Number(event.target.value) }))}
                              className={inputClassName}
                            >
                              {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score} / 5</option>)}
                            </select>
                          </label>
                        </div>
                      ))}
                    </fieldset>

                    <label className="block text-sm font-semibold text-on-surface-variant">
                      결과
                      <select value={evalResult} onChange={(event) => setEvalResult(event.target.value as EvaluationResult)} className={inputClassName}>
                        {evaluationResultOptions.map((option) => (
                          <option key={option.value} value={option.value}>{getEvaluationResultLabel(option.value)}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm font-semibold text-on-surface-variant">
                      코멘트
                      <textarea rows={3} value={evalComment} onChange={(event) => setEvalComment(event.target.value)} className={`${inputClassName} resize-y`} placeholder="면접 결과를 요약해 주세요." />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button type="submit" disabled={isAddingEval} className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                        {isAddingEval ? "저장 중..." : "평가 저장"}
                      </button>
                      <button type="button" onClick={() => setEvalFormOpen(null)} className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest">
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-on-surface-variant">
                      {canAddEvaluation
                        ? "면접이 완료되었습니다. 필요한 경우 평가를 추가하세요."
                        : interview.status !== "COMPLETED"
                          ? "면접이 완료 처리된 후 평가를 추가할 수 있습니다."
                          : "공고 설정에서 이 면접 단계의 평가 기준을 먼저 구성하세요."}
                    </p>
                    <button
                      type="button"
                      disabled={!canAddEvaluation}
                      onClick={() => {
                        setEvalFormOpen(interview.id);
                        setEvalScores(Object.fromEntries(scorecardCriteria.map((criterion) => [criterion.id, 3])));
                        setEvalCriterionComments({});
                        setEvalResult("PASS");
                        setEvalComment("");
                      }}
                      className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      평가 추가
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
