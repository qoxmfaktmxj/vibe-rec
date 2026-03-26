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
  { value: "OFFER", label: "泥섏슦 ?쒖븞" },
  { value: "REJECTION", label: "遺덊빀寃??덈궡" },
  { value: "INTERVIEW_INVITE", label: "硫댁젒 ?덈궡" },
  { value: "GENERAL", label: "?쇰컲 ?덈궡" },
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
            setMessage(body.message ?? "?뚮┝????ν븯吏 紐삵뻽?듬땲??");
            return;
          }

          setMessage("?뚮┝ ?대젰????ν뻽?듬땲??");
          setShowForm(false);
          setType("GENERAL");
          setTitle("");
          setContent("");
          router.refresh();
        } catch {
          setIsError(true);
          setMessage("?ㅽ듃?뚰겕 ?ㅻ쪟濡??뚮┝????ν븯吏 紐삵뻽?듬땲??");
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
            吏?먯옄 而ㅻ??덉??댁뀡
          </p>
          <div className="space-y-2">
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">
              諛쒖넚 ?대젰???쒓납?먯꽌 愿由ы븯?몄슂
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
              吏?먯옄?먭쾶 ?꾨떖???덈궡 ?댁슜???④꺼 ?먮㈃ ?ㅼ쓬 ?④퀎 ?대떦?먮룄 理쒖떊
              ?곹솴??諛붾줈 ?뚯븙?????덉뒿?덈떎.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
        >
          {showForm ? "?낅젰 ?リ린" : "?뚮┝ 異붽?"}
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
            ???뚮┝
          </h3>

          <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
            <label className="block text-sm font-semibold text-on-surface-variant">
              ?좏삎
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
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
              ?쒕ぉ
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                disabled={isPending}
                className={inputClassName}
                placeholder="?대젰?먯꽌 諛붾줈 ?앸퀎?????덈뒗 吏㏃? ?쒕ぉ"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-on-surface-variant">
            ?댁슜
            <textarea
              rows={4}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              disabled={isPending}
              className={`${inputClassName} resize-y`}
              placeholder="?ㅼ젣 諛쒖넚 ?댁슜 ?먮뒗 ?붿빟 硫붾え瑜??④꺼 二쇱꽭??"
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "???以?.." : "?뚮┝ ???}
          </button>
        </form>
      ) : null}

      {notifications.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-6 py-10 text-center">
          <p className="text-sm font-semibold text-on-surface">
            ?꾩쭅 ?뚮┝ ?대젰???놁뒿?덈떎
          </p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            泥?而ㅻ??덉??댁뀡 ?대젰???④꺼 吏?먯옄蹂?湲곕줉???쒖옉??蹂댁꽭??
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
                  湲곕줉?? {notification.sentByName}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

