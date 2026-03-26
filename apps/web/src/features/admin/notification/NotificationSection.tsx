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
  { value: "OFFER", label: "Offer" },
  { value: "REJECTION", label: "Rejection" },
  { value: "INTERVIEW_INVITE", label: "Interview invite" },
  { value: "GENERAL", label: "General" },
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

          const body = (await response.json()) as { message?: string };
          if (!response.ok) {
            setIsError(true);
            setMessage(body.message ?? "Could not send the notification.");
            return;
          }

          setMessage("Notification logged.");
          setShowForm(false);
          setType("GENERAL");
          setTitle("");
          setContent("");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("A network error prevented the notification update.");
        } finally {
          setIsPending(false);
        }
      })();
    });
  }

  return (
    <section className="ambient-shadow rounded-[28px] border border-outline-variant/70 bg-surface-container-lowest p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
            Candidate communication
          </p>
          <div className="space-y-2">
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
              Keep outbound messages visible
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              Log what the candidate was told so anyone picking up the workflow
              understands the latest communication immediately.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
        >
          {showForm ? "Hide composer" : "Add notification"}
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
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            New notification
          </h3>

          <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
            <label className="block text-sm font-semibold text-on-surface-variant">
              Type
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isPending}
                className={inputClassName}
              >
                {notificationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-on-surface-variant">
              Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isPending}
                className={inputClassName}
                placeholder="Short summary for the activity feed"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-on-surface-variant">
            Message
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isPending}
              className={`${inputClassName} resize-y`}
              placeholder="Capture the exact message or a concise summary of what was sent."
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save notification"}
          </button>
        </form>
      ) : null}

      {notifications.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-6 py-10 text-center">
          <p className="text-sm font-semibold text-on-surface">
            No notifications yet
          </p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            Add the first communication entry to create a visible history for
            this applicant.
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
                  Logged by {notification.sentByName}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
