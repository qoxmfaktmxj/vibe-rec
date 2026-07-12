"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AdminJobPosting } from "@/entities/admin/model";

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const publicationStateLabel: Record<AdminJobPosting["publicationState"], string> = {
  DRAFT: "초안",
  SCHEDULED: "공개 예약",
  PUBLISHED: "공개 중",
  CLOSED: "모집 종료",
};

export function JobPostingLifecycleActions({ jobPosting }: { jobPosting: AdminJobPosting }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [publishAt, setPublishAt] = useState(toDateTimeLocalValue(jobPosting.opensAt));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentlyPublic =
    jobPosting.published && new Date(jobPosting.opensAt).getTime() <= Date.now();

  function clonePosting() {
    startTransition(async () => {
      setMessage(null);
      setError(null);
      try {
        const response = await fetch(`/api/admin/job-postings/${jobPosting.id}/clone`, {
          method: "POST",
        });
        const body = (await response.json().catch(() => null)) as { id?: number; message?: string } | null;
        if (!response.ok || !body?.id) {
          throw new Error(body?.message ?? "공고를 복제하지 못했습니다.");
        }
        router.push(`/admin/job-postings/${body.id}`);
        router.refresh();
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "공고를 복제하지 못했습니다.");
      }
    });
  }

  function schedulePublication() {
    if (!publishAt) {
      setError("공개 시각을 입력해 주세요.");
      return;
    }
    startTransition(async () => {
      setMessage(null);
      setError(null);
      try {
        const response = await fetch(`/api/admin/job-postings/${jobPosting.id}/publication`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publishAt: new Date(publishAt).toISOString() }),
        });
        const body = (await response.json().catch(() => null)) as {
          publicationState?: AdminJobPosting["publicationState"];
          message?: string;
        } | null;
        if (!response.ok) {
          throw new Error(body?.message ?? "공개 일정을 변경하지 못했습니다.");
        }
        setMessage(
          body?.publicationState === "SCHEDULED"
            ? "공개 일정을 예약했습니다. 예약 시각 전까지 공개 사이트에는 표시되지 않습니다."
            : "공고를 공개했습니다.",
        );
        router.refresh();
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "공개 일정을 변경하지 못했습니다.");
      }
    });
  }

  return (
    <section className="rounded-lg border border-outline-variant bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
            공고 수명주기
          </p>
          <h2 className="mt-2 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            {publicationStateLabel[jobPosting.publicationState]}
          </h2>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            미리보기로 내용을 검토하고, 새 초안을 복제하거나 공개 시각을 예약합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/job-postings/${jobPosting.id}/preview`}
            className="min-h-[44px] rounded-lg border border-primary/30 bg-card px-4 py-2.5 text-sm font-semibold text-primary focus:ring-2 focus:ring-primary/20"
          >
            미리보기
          </Link>
          <button
            type="button"
            onClick={clonePosting}
            disabled={isPending}
            className="min-h-[44px] rounded-lg border border-outline-variant bg-card px-4 py-2.5 text-sm font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            초안 복제
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(280px,420px)_auto] lg:items-end">
        <label className="text-sm font-semibold text-on-surface-variant">
          공개 시각
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(event) => setPublishAt(event.target.value)}
            disabled={isPending || currentlyPublic}
            className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        </label>
        <button
          type="button"
          onClick={schedulePublication}
          disabled={isPending || currentlyPublic}
          className="min-h-[44px] rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "처리 중…" : "예약 또는 즉시 공개"}
        </button>
      </div>
      {currentlyPublic ? (
        <p className="mt-3 text-sm text-on-surface-variant">
          이미 공개된 공고는 편집 폼에서 비공개로 저장한 뒤 공개 일정을 변경할 수 있습니다.
        </p>
      ) : null}
      {message ? <p role="status" aria-live="polite" className="mt-4 rounded-lg bg-primary-container px-4 py-3 text-sm text-on-surface">{message}</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-lg bg-error-container px-4 py-3 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
