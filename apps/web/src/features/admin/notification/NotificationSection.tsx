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
  { value: "OFFER", label: "오퍼" },
  { value: "REJECTION", label: "불합격 통보" },
  { value: "INTERVIEW_INVITE", label: "면접 안내" },
  { value: "GENERAL", label: "일반" },
];

const inputClassName =
  "mt-2 w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

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

          const body = (await response.json()) as { message?: string };
          if (!response.ok) {
            setIsError(true);
            setMessage(body.message ?? "통지를 발송하지 못했습니다.");
            return;
          }

          setMessage("통지를 발송했습니다.");
          setShowForm(false);
          setType("GENERAL");
          setTitle("");
          setContent("");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("통지 발송 중 오류가 발생했습니다.");
        } finally {
          setIsPending(false);
        }
      })();
    });
  }

  return (
    <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-headline text-2xl font-bold text-on-surface">
          통지 이력
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
        >
          {showForm ? "취소" : "새 통지"}
        </button>
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

      {/* New Notification Form */}
      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl bg-surface-container-low p-6"
        >
          <h3 className="text-sm font-semibold text-on-surface-variant">
            새 통지 작성
          </h3>

          <label className="block text-sm font-semibold text-on-surface-variant">
            유형
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isPending}
              className={inputClassName}
            >
              {notificationTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            제목
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
              className={inputClassName}
              placeholder="통지 제목을 입력하세요."
            />
          </label>

          <label className="block text-sm font-semibold text-on-surface-variant">
            내용
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isPending}
              className={`${inputClassName} resize-y`}
              placeholder="통지 내용을 입력하세요."
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "발송 중..." : "통지 발송"}
          </button>
        </form>
      ) : null}

      {/* Notification History */}
      {notifications.length === 0 ? (
        <p className="mt-6 text-sm text-on-surface-variant">
          발송된 통지가 없습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-xl bg-surface-container-low px-6 py-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getNotificationTypeClassName(notification.type)}`}
                >
                  {getNotificationTypeLabel(notification.type)}
                </span>
                <span className="font-semibold text-on-surface">
                  {notification.title}
                </span>
                <span className="ml-auto text-xs text-outline">
                  {formatDateTime(notification.createdAt)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-on-surface-variant">
                {notification.content}
              </p>
              {notification.sentByName ? (
                <p className="mt-2 text-xs text-outline">
                  발송: {notification.sentByName}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
