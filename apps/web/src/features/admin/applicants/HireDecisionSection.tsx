"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type {
  HireDecision,
  HireDecisionType,
  NotificationLog,
  NotificationPreview,
  NotificationTemplate,
} from "@/entities/admin/hire-model";

interface HireDecisionSectionProps {
  applicationId: number;
  decision: HireDecision | null;
  templates: NotificationTemplate[];
  notificationHistory: NotificationLog[];
}

const decisionLabels: Record<HireDecisionType, string> = {
  HIRED: "최종 합격",
  REJECTED: "불합격",
  WITHDRAWN: "지원 철회",
};

const decisionClassNames: Record<HireDecisionType, string> = {
  HIRED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};

const statusLabels: Record<string, string> = {
  SENT: "발송 완료",
  PENDING: "발송 대기",
  FAILED: "발송 실패",
  CANCELLED: "취소됨",
};

const statusClassNames: Record<string, string> = {
  SENT: "text-green-700",
  PENDING: "text-outline",
  FAILED: "text-destructive",
  CANCELLED: "text-outline",
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

export function HireDecisionSection({
  applicationId,
  decision,
  templates,
  notificationHistory,
}: HireDecisionSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 결정 폼
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decisionForm, setDecisionForm] = useState({
    decision: "HIRED" as HireDecisionType,
    salaryInfo: "",
    startDate: "",
    note: "",
  });
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // 통지
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [preview, setPreview] = useState<NotificationPreview | null>(null);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);

  const inputCls =
    "w-full rounded-lg border-none bg-surface-container-highest px-4 py-2.5 text-sm text-on-surface outline-none transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";
  const btnPrimary =
    "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
  const btnSec =
    "rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:opacity-50";

  async function handleCreateDecision() {
    setDecisionError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/applicants/${applicationId}/hire-decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: decisionForm.decision,
            salaryInfo: decisionForm.salaryInfo || undefined,
            startDate: decisionForm.startDate || undefined,
            note: decisionForm.note || undefined,
          }),
        });
        if (!res.ok) {
          const err = (await res.json()) as { message?: string };
          setDecisionError(err.message ?? "결정 등록에 실패했습니다.");
          return;
        }
        setShowDecisionForm(false);
        router.refresh();
      } catch {
        setDecisionError("결정 등록 중 오류가 발생했습니다.");
      }
    });
  }

  async function handlePreview(template: NotificationTemplate) {
    setNotifError(null);
    setPreview(null);
    setSelectedTemplate(template);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/applicants/${applicationId}/notifications/preview/${template.templateId}`,
        );
        if (!res.ok) {
          const err = (await res.json()) as { message?: string };
          setNotifError(err.message ?? "미리보기 실패");
          return;
        }
        const data = (await res.json()) as NotificationPreview;
        setPreview(data);
      } catch {
        setNotifError("미리보기 중 오류가 발생했습니다.");
      }
    });
  }

  async function handleSend() {
    if (!selectedTemplate) return;
    setNotifError(null);
    setNotifSuccess(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/applicants/${applicationId}/notifications/send/${selectedTemplate.templateId}`,
          { method: "POST" },
        );
        if (!res.ok) {
          const err = (await res.json()) as { message?: string };
          setNotifError(err.message ?? "발송 실패");
          return;
        }
        setPreview(null);
        setSelectedTemplate(null);
        setNotifSuccess("통지가 발송되었습니다.");
        router.refresh();
      } catch {
        setNotifError("발송 중 오류가 발생했습니다.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* 최종 결정 */}
      <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-headline text-2xl font-bold text-on-surface">
            최종 결정
          </h2>
          {!decision ? (
            <button
              type="button"
              disabled={isPending}
              className={btnSec}
              onClick={() => setShowDecisionForm((v) => !v)}
            >
              {showDecisionForm ? "취소" : "+ 결정 등록"}
            </button>
          ) : null}
        </div>

        {decision ? (
          <div className="mt-4">
            <span
              className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${decisionClassNames[decision.decision]}`}
            >
              {decisionLabels[decision.decision]}
            </span>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {decision.salaryInfo ? (
                <div>
                  <dt className="text-xs font-semibold text-on-surface-variant">
                    제안 연봉
                  </dt>
                  <dd className="mt-1 text-on-surface">{decision.salaryInfo}</dd>
                </div>
              ) : null}
              {decision.startDate ? (
                <div>
                  <dt className="text-xs font-semibold text-on-surface-variant">
                    입사 예정일
                  </dt>
                  <dd className="mt-1 text-on-surface">{decision.startDate}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-semibold text-on-surface-variant">
                  결정 일시
                </dt>
                <dd className="mt-1 text-on-surface">
                  {formatDateTime(decision.decidedAt)}
                </dd>
              </div>
            </div>
            {decision.note ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-on-surface-variant">
                {decision.note}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-outline">
            아직 최종 결정이 내려지지 않았습니다.
          </p>
        )}

        {showDecisionForm ? (
          <div className="mt-6 space-y-3 rounded-xl bg-surface-container-low p-5">
            <h3 className="text-sm font-semibold text-on-surface-variant">
              최종 결정 등록
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                  결정 *
                </label>
                <select
                  className={inputCls}
                  value={decisionForm.decision}
                  onChange={(e) =>
                    setDecisionForm((f) => ({
                      ...f,
                      decision: e.target.value as HireDecisionType,
                    }))
                  }
                >
                  <option value="HIRED">최종 합격</option>
                  <option value="REJECTED">불합격</option>
                  <option value="WITHDRAWN">지원 철회</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                  입사 예정일
                </label>
                <input
                  type="date"
                  className={inputCls}
                  value={decisionForm.startDate}
                  onChange={(e) =>
                    setDecisionForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                  제안 연봉
                </label>
                <input
                  type="text"
                  placeholder="예: 5,000만원 / 협의"
                  className={inputCls}
                  value={decisionForm.salaryInfo}
                  onChange={(e) =>
                    setDecisionForm((f) => ({ ...f, salaryInfo: e.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-on-surface-variant">
                  메모
                </label>
                <textarea
                  rows={3}
                  className={`resize-y ${inputCls}`}
                  value={decisionForm.note}
                  onChange={(e) =>
                    setDecisionForm((f) => ({ ...f, note: e.target.value }))
                  }
                />
              </div>
            </div>
            {decisionError ? (
              <p className="text-xs text-destructive">{decisionError}</p>
            ) : null}
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isPending}
                className={btnPrimary}
                onClick={handleCreateDecision}
              >
                결정 등록
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {/* 통지 발송 */}
      <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
        <h2 className="font-headline text-2xl font-bold text-on-surface">
          통지 발송
        </h2>

        {templates.length > 0 ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-on-surface-variant">
              템플릿을 선택하면 미리보기를 확인하고 발송할 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.templateId}
                  type="button"
                  disabled={isPending}
                  className={`${btnSec} ${selectedTemplate?.templateId === tpl.templateId ? "ring-2 ring-primary" : ""}`}
                  onClick={() => handlePreview(tpl)}
                >
                  {tpl.title.replace(/\{\{[^}]+\}\}/g, "…")}
                </button>
              ))}
            </div>

            {notifError ? (
              <p className="text-xs text-destructive">{notifError}</p>
            ) : null}
            {notifSuccess ? (
              <p className="text-xs font-semibold text-green-700">{notifSuccess}</p>
            ) : null}

            {preview ? (
              <div className="mt-4 rounded-xl bg-surface-container-low p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-on-surface-variant">
                    미리보기
                  </h3>
                  <span className="text-xs text-outline">
                    {preview.channel} → {preview.recipient}
                  </span>
                </div>
                <p className="text-sm font-semibold text-on-surface">{preview.subject}</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-surface-container-lowest p-4 text-xs leading-6 text-on-surface-variant">
                  {preview.body}
                </pre>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    className={btnSec}
                    onClick={() => {
                      setPreview(null);
                      setSelectedTemplate(null);
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    className={btnPrimary}
                    onClick={handleSend}
                  >
                    발송
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-outline">
            등록된 통지 템플릿이 없습니다.
          </p>
        )}
      </section>

      {/* 발송 이력 */}
      <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
        <h2 className="font-headline text-2xl font-bold text-on-surface">
          발송 이력
          <span className="ml-2 text-base font-normal text-outline">
            {notificationHistory.length}건
          </span>
        </h2>

        {notificationHistory.length > 0 ? (
          <div className="mt-5 space-y-3">
            {notificationHistory.map((log) => (
              <div
                key={log.logId}
                className="rounded-xl bg-surface-container-low p-4 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-on-surface">{log.subject}</span>
                  <span
                    className={`text-xs font-semibold ${statusClassNames[log.status]}`}
                  >
                    {statusLabels[log.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-outline">
                  {log.channel} → {log.recipient}
                  {log.sentAt
                    ? ` · ${formatDateTime(log.sentAt)}`
                    : ` · ${formatDateTime(log.createdAt)}`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-outline">발송 이력이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
