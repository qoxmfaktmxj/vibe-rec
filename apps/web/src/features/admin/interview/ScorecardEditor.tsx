"use client";

import { useState } from "react";

import type { JobPostingStep, ScorecardCriterion } from "@/entities/recruitment/model";

type CriterionDraft = Omit<ScorecardCriterion, "id" | "jobPostingStepId" | "sortOrder"> & {
  id?: number;
};

const defaultCriteria: CriterionDraft[] = [
  { name: "직무 역량", description: "직무 수행에 필요한 전문성과 경험", weight: 40, required: true },
  { name: "문제 해결", description: "문제를 구조화하고 실행 가능한 해법을 만드는 능력", weight: 35, required: true },
  { name: "협업과 소통", description: "이해관계자와 명확하게 협업하는 능력", weight: 25, required: true },
];

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? fallback;
}

export function ScorecardEditor({
  jobPostingId,
  interviewSteps,
  initialCriteriaByStep,
}: {
  jobPostingId: number;
  interviewSteps: Array<JobPostingStep & { id: number }>;
  initialCriteriaByStep: Record<number, ScorecardCriterion[]>;
}) {
  const [criteriaByStep, setCriteriaByStep] = useState<Record<number, CriterionDraft[]>>(initialCriteriaByStep);
  const [pendingStepId, setPendingStepId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setCriteria(stepId: number, criteria: CriterionDraft[]) {
    setCriteriaByStep((current) => ({ ...current, [stepId]: criteria }));
  }

  function updateCriterion(stepId: number, index: number, patch: Partial<CriterionDraft>) {
    const criteria = [...(criteriaByStep[stepId] ?? [])];
    criteria[index] = { ...criteria[index], ...patch };
    setCriteria(stepId, criteria);
  }

  async function saveStep(stepId: number) {
    const criteria = criteriaByStep[stepId] ?? [];
    if (criteria.length === 0 || criteria.some((criterion) => !criterion.name.trim())) {
      setError("모든 평가 기준의 이름을 입력해 주세요.");
      return;
    }
    if (!criteria.some((criterion) => criterion.required)) {
      setError("필수 평가 기준을 하나 이상 지정해 주세요.");
      return;
    }
    setPendingStepId(stepId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/job-postings/${jobPostingId}/steps/${stepId}/scorecard`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria }),
      });
      if (!response.ok) throw new Error(await responseError(response, "평가 기준을 저장하지 못했습니다."));
      setCriteria(stepId, (await response.json()) as ScorecardCriterion[]);
      setMessage("평가 기준을 저장했습니다.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "평가 기준을 저장하지 못했습니다.");
    } finally {
      setPendingStepId(null);
    }
  }

  if (interviewSteps.length === 0) return null;

  return (
    <section className="rounded-sm border border-outline-variant bg-card p-6">
      <h2 className="font-headline text-2xl font-medium tracking-[-0.04em]">면접 평가표</h2>
      <p className="mt-2 text-sm leading-7 text-on-surface-variant">
        단계별 평가 기준과 가중치를 설정합니다. 평가가 제출된 단계의 기준은 더 이상 변경할 수 없습니다.
      </p>

      <div className="mt-6 space-y-6">
        {interviewSteps.map((step) => {
          const criteria = criteriaByStep[step.id] ?? [];
          return (
            <section key={step.id} className="border border-outline-variant bg-surface-container-lowest p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-on-surface">{step.title}</h3>
                  <p className="mt-1 text-xs text-on-surface-variant">평가 기준 {criteria.length}개</p>
                </div>
                {criteria.length === 0 ? (
                  <button type="button" onClick={() => setCriteria(step.id, defaultCriteria.map((criterion) => ({ ...criterion })))} className="border border-outline px-3 py-2 text-xs font-semibold">
                    기본 기준 불러오기
                  </button>
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
                {criteria.map((criterion, index) => (
                  <fieldset key={criterion.id ?? index} className="grid gap-3 border border-outline-variant bg-card p-4 lg:grid-cols-[1fr_1.5fr_110px_auto_auto] lg:items-end">
                    <legend className="sr-only">{index + 1}번째 평가 기준</legend>
                    <label className="text-xs font-semibold text-on-surface-variant">
                      기준 이름
                      <input value={criterion.name} onChange={(event) => updateCriterion(step.id, index, { name: event.target.value })} maxLength={120} className="mt-1 w-full border border-outline-variant px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs font-semibold text-on-surface-variant">
                      설명
                      <input value={criterion.description ?? ""} onChange={(event) => updateCriterion(step.id, index, { description: event.target.value })} maxLength={500} className="mt-1 w-full border border-outline-variant px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs font-semibold text-on-surface-variant">
                      가중치
                      <input type="number" min={1} max={100} value={criterion.weight} onChange={(event) => updateCriterion(step.id, index, { weight: Number(event.target.value) })} className="mt-1 w-full border border-outline-variant px-3 py-2 text-sm" />
                    </label>
                    <label className="flex items-center gap-2 pb-2 text-sm font-medium">
                      <input type="checkbox" checked={criterion.required} onChange={(event) => updateCriterion(step.id, index, { required: event.target.checked })} />
                      필수
                    </label>
                    <button type="button" onClick={() => setCriteria(step.id, criteria.filter((_, itemIndex) => itemIndex !== index))} className="pb-2 text-xs font-semibold text-destructive">
                      제거
                    </button>
                  </fieldset>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={criteria.length >= 20} onClick={() => setCriteria(step.id, [...criteria, { name: "", description: "", weight: 20, required: true }])} className="border border-outline px-3 py-2 text-xs font-semibold disabled:opacity-50">
                  기준 추가
                </button>
                <button type="button" disabled={pendingStepId !== null || criteria.length === 0} onClick={() => void saveStep(step.id)} className="bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                  {pendingStepId === step.id ? "저장 중..." : "이 단계 저장"}
                </button>
              </div>
            </section>
          );
        })}
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
      {message ? <p role="status" aria-live="polite" className="mt-4 text-sm text-emerald-800">{message}</p> : null}
    </section>
  );
}
