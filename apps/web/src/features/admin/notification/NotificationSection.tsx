"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  NotificationResponse,
  NotificationTemplatePreview,
} from "@/entities/recruitment/model";
import {
  formatDateTime,
  getNotificationTypeClassName,
  getNotificationTypeLabel,
} from "@/shared/lib/recruitment";

interface NotificationSectionProps {
  applicationId: number;
  notifications: NotificationResponse[];
  templates: NotificationTemplatePreview[];
  canSend: boolean;
}

const notificationTypeOptions = ["OFFER", "REJECTION", "INTERVIEW_INVITE", "GENERAL"];

const inputClassName =
  "mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-ring/25";

function getDeliveryStatusLabel(status: NotificationResponse["deliveryStatus"]) {
  switch (status) {
    case "PENDING":
      return "전송 대기";
    case "DELIVERED":
      return "전달 완료";
    case "FAILED":
      return "전송 실패";
  }
}

function getDeliveryStatusClassName(status: NotificationResponse["deliveryStatus"]) {
  switch (status) {
    case "PENDING":
      return "bg-surface-container-high text-on-surface";
    case "DELIVERED":
      return "bg-primary-container text-primary";
    case "FAILED":
      return "bg-error-container text-destructive";
  }
}

export function NotificationSection({
  applicationId,
  notifications,
  templates,
  canSend,
}: NotificationSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [type, setType] = useState("GENERAL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  useEffect(() => {
    if (!notifications.some((notification) =>
      notification.deliveryStatus === "PENDING" ||
      (notification.deliveryStatus === "FAILED" && notification.nextAttemptAt),
    )) {
      return;
    }
    const timeoutId = window.setTimeout(() => router.refresh(), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [notifications, router]);

  function selectTemplate(value: string) {
    setSelectedTemplateId(value);
    const template = templates.find((candidate) => candidate.id === Number(value));
    if (!template) return;
    setType(template.type);
    setTitle(template.title);
    setContent(template.content);
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
            `/api/admin/applicants/${applicationId}/notifications`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                templateId: selectedTemplateId ? Number(selectedTemplateId) : null,
                type,
                title,
                content,
              }),
            },
          );
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          if (!response.ok) {
            setIsError(true);
            setMessage(body?.message ?? "통지를 전송 대기열에 등록하지 못했습니다.");
            return;
          }

          setMessage("통지를 전송 대기열에 등록했습니다.");
          setShowForm(false);
          setSelectedTemplateId("");
          setType("GENERAL");
          setTitle("");
          setContent("");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("통지 등록 중 네트워크 오류가 발생했습니다.");
        } finally {
          setIsPending(false);
        }
      })();
    });
  }

  async function retryDelivery(notificationId: number) {
    setRetryingId(notificationId);
    setMessage(null);
    setIsError(false);
    try {
      const response = await fetch(
        `/api/admin/applicants/${applicationId}/notifications/${notificationId}/retry`,
        { method: "POST" },
      );
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setIsError(true);
        setMessage(body?.message ?? "통지 재시도 요청에 실패했습니다.");
        return;
      }
      setMessage("실패한 통지를 전송 대기열에 다시 등록했습니다.");
      router.refresh();
    } catch {
      setIsError(true);
      setMessage("통지 재시도 중 네트워크 오류가 발생했습니다.");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-outline-variant bg-card p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
            커뮤니케이션
          </p>
          <h2 className="mt-2 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            지원자 통지
          </h2>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            발송 문구, 전달 상태, 읽음 여부와 재시도 이력을 확인합니다.
          </p>
        </div>

        {canSend ? (
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="min-h-[44px] rounded-lg border border-primary/30 bg-card px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 focus:ring-2 focus:ring-primary/20"
          >
            {showForm ? "닫기" : "통지 작성"}
          </button>
        ) : null}
      </div>

      {message ? (
        <div
          role={isError ? "alert" : "status"}
          aria-live="polite"
          aria-atomic="true"
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${
            isError
              ? "bg-error-container text-destructive"
              : "bg-secondary-container text-emerald-900"
          }`}
        >
          {message}
        </div>
      ) : null}

      {showForm && canSend ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-outline-variant/70 bg-surface-container-low p-6"
        >
          <label className="block text-sm font-semibold text-on-surface-variant">
            메시지 템플릿
            <select
              value={selectedTemplateId}
              onChange={(event) => selectTemplate(event.target.value)}
              disabled={isPending}
              className={inputClassName}
            >
              <option value="">직접 작성</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
            <label className="block text-sm font-semibold text-on-surface-variant">
              유형
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value);
                  setSelectedTemplateId("");
                }}
                disabled={isPending}
                className={inputClassName}
              >
                {notificationTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {getNotificationTypeLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-on-surface-variant">
              제목
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={200}
                disabled={isPending}
                className={inputClassName}
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-on-surface-variant">
            내용
            <textarea
              rows={6}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              maxLength={5000}
              disabled={isPending}
              className={`${inputClassName} resize-y`}
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-black/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "등록 중…" : "전송 대기열에 등록"}
          </button>
        </form>
      ) : null}

      {notifications.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-outline-variant/70 bg-surface-container-low px-6 py-10 text-center">
          <p className="text-sm font-semibold text-on-surface">통지 이력이 없습니다.</p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            작성 권한이 있는 관리자는 템플릿으로 첫 통지를 등록할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className="rounded-xl border border-outline-variant/70 bg-surface-container-low px-6 py-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getNotificationTypeClassName(notification.type)}`}
                >
                  {getNotificationTypeLabel(notification.type)}
                </span>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDeliveryStatusClassName(notification.deliveryStatus)}`}>
                  {getDeliveryStatusLabel(notification.deliveryStatus)}
                </span>
                <h3 className="font-semibold text-on-surface">{notification.title}</h3>
                <time className="ml-auto font-mono text-[11px] text-on-surface-variant">
                  {formatDateTime(notification.createdAt)}
                </time>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-on-surface-variant">
                {notification.content}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-outline-variant pt-3 text-xs text-on-surface-variant">
                {notification.sentByName ? <span>{notification.sentByName} 등록</span> : null}
                <span>전송 시도 {notification.deliveryAttempts}회</span>
                {notification.manualRetryCount > 0 ? <span>수동 재시도 {notification.manualRetryCount}회</span> : null}
                {notification.deliveredAt ? <span>전달 {formatDateTime(notification.deliveredAt)}</span> : null}
                {notification.readAt ? <span>지원자 읽음 {formatDateTime(notification.readAt)}</span> : null}
                {notification.lastError ? <span className="text-destructive">{notification.lastError}</span> : null}
                {canSend && notification.deliveryStatus === "FAILED" ? (
                  <button
                    type="button"
                    disabled={retryingId !== null}
                    onClick={() => void retryDelivery(notification.id)}
                    className="ml-auto min-h-[44px] rounded-lg border border-primary/30 bg-card px-3.5 py-2 text-xs font-semibold text-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  >
                    {retryingId === notification.id ? "재시도 요청 중…" : "지금 재시도"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
