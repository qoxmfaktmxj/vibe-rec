"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { NotificationResponse } from "@/entities/recruitment/model";
import {
  formatDateTime,
  getNotificationTypeClassName,
  getNotificationTypeLabel,
} from "@/shared/lib/recruitment";

interface NotificationSectionProps {
  applicationId: number;
  notifications: NotificationResponse[];
}

const notificationTypeOptions = [
  { value: "OFFER", label: getNotificationTypeLabel("OFFER") },
  { value: "REJECTION", label: getNotificationTypeLabel("REJECTION") },
  { value: "INTERVIEW_INVITE", label: getNotificationTypeLabel("INTERVIEW_INVITE") },
  { value: "GENERAL", label: getNotificationTypeLabel("GENERAL") },
];

const inputClassName =
  "mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

export function NotificationSection({
  applicationId,
  notifications,
}: NotificationSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("GENERAL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, setIsPending] = useState(false);

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
              body: JSON.stringify({ type, title, content }),
            },
          );

          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          if (!response.ok) {
            setIsError(true);
            setMessage(body?.message ?? "Failed to send the notification.");
            return;
          }

          setMessage("Notification recorded.");
          setShowForm(false);
          setType("GENERAL");
          setTitle("");
          setContent("");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("A network error occurred while sending the notification.");
        } finally {
          setIsPending(false);
        }
      })();
    });
  }

  return (
    <section className="rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
            알림 관리
          </p>
          <div className="space-y-2">
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
              지원자 커뮤니케이션을 기록합니다
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              지원자에게 발송된 메시지 내역을 보관합니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
        >
          {showForm ? "닫기" : "알림 추가"}
        </button>
      </div>

      {message ? (
        <div
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${
            isError
              ? "bg-error-container text-destructive"
              : "bg-secondary-container text-[#00731e]"
          }`}
        >
          {message}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-6"
        >
          <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
            <label className="block text-sm font-semibold text-on-surface-variant">
              유형
              <select value={type} onChange={(event) => setType(event.target.value)} disabled={isPending} className={inputClassName}>
                {notificationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-on-surface-variant">
              제목
              <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} required disabled={isPending} className={inputClassName} placeholder="간략한 제목을 입력하세요" />
            </label>
          </div>

          <label className="block text-sm font-semibold text-on-surface-variant">
            내용
            <textarea rows={4} value={content} onChange={(event) => setContent(event.target.value)} required disabled={isPending} className={`${inputClassName} resize-y`} placeholder="메시지 내용을 요약해 주세요..." />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "저장 중..." : "알림 저장"}
          </button>
        </form>
      ) : null}

      {notifications.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-6 py-10 text-center">
          <p className="text-sm font-semibold text-on-surface">등록된 알림이 없습니다.</p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            첫 번째 커뮤니케이션을 기록하세요.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-2xl border border-outline-variant/70 bg-surface-container-low px-6 py-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getNotificationTypeClassName(notification.type)}`}
                >
                  {getNotificationTypeLabel(notification.type)}
                </span>
                <span className="font-semibold text-on-surface">{notification.title}</span>
                <span className="ml-auto text-xs text-outline">{formatDateTime(notification.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-on-surface-variant">
                {notification.content}
              </p>
              {notification.sentByName ? (
                <p className="mt-2 text-xs text-outline">{notification.sentByName} 등록</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
