"use client";

import { useState } from "react";

import type { CandidateNotification } from "@/entities/recruitment/model";
import {
  formatDateTime,
  getNotificationTypeLabel,
} from "@/shared/lib/recruitment";

interface CandidateNotificationPanelProps {
  initialNotifications: CandidateNotification[];
}

export function CandidateNotificationPanel({
  initialNotifications,
}: CandidateNotificationPanelProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  async function markRead(notificationId: number) {
    setPendingId(notificationId);
    setError(null);
    try {
      const response = await fetch(
        `/api/candidate/notifications/${notificationId}/read`,
        { method: "PATCH" },
      );
      const body = (await response.json().catch(() => null)) as
        | CandidateNotification
        | { message?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          body && "message" in body && body.message
            ? body.message
            : "알림을 읽음 처리하지 못했습니다.",
        );
      }
      const updated = body as CandidateNotification;
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === updated.id ? updated : notification,
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "알림을 읽음 처리하지 못했습니다.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-sm border border-outline-variant bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-lg font-medium tracking-[-0.04em]">
            채용 알림
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            읽지 않은 알림 {unreadCount}건
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {notifications.length === 0 ? (
        <p className="mt-5 text-sm text-on-surface-variant">
          전달된 채용 알림이 없습니다.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-outline-variant">
          {notifications.map((notification) => (
            <li key={notification.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-on-surface-variant">
                    {getNotificationTypeLabel(notification.type)} · {notification.jobPostingTitle}
                  </p>
                  <h3 className={`mt-1 text-sm ${notification.readAt ? "font-medium" : "font-semibold"}`}>
                    {notification.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-on-surface-variant">
                    {notification.content}
                  </p>
                  <p className="mt-2 text-xs text-outline">
                    {formatDateTime(notification.deliveredAt)}
                  </p>
                </div>
                {!notification.readAt ? (
                  <button
                    type="button"
                    disabled={pendingId === notification.id}
                    onClick={() => void markRead(notification.id)}
                    className="shrink-0 rounded-sm border border-outline-variant px-3 py-2 text-xs font-medium disabled:opacity-50"
                  >
                    {pendingId === notification.id ? "처리 중" : "읽음 처리"}
                  </button>
                ) : (
                  <span className="text-xs text-on-surface-variant">읽음</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
