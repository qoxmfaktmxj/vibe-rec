"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { AdminJobPostingPayload } from "@/entities/admin/model";

const fieldClassName =
  "w-full rounded-sm border border-outline-variant bg-background px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary";

interface JobPostingEditorFormProps {
  mode: "create" | "edit";
  jobPostingId?: number;
  initialValue: AdminJobPostingPayload;
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toPayloadDateTime(value: string) {
  return new Date(value).toISOString();
}

export function JobPostingEditorForm({
  mode,
  jobPostingId,
  initialValue,
}: JobPostingEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    legacyAnnoId: initialValue.legacyAnnoId?.toString() ?? "",
    publicKey: initialValue.publicKey,
    title: initialValue.title,
    headline: initialValue.headline,
    description: initialValue.description,
    employmentType: initialValue.employmentType,
    recruitmentCategory: initialValue.recruitmentCategory,
    recruitmentMode: initialValue.recruitmentMode,
    location: initialValue.location,
    status: initialValue.status,
    published: initialValue.published,
    opensAt: toDateTimeLocalValue(initialValue.opensAt),
    closesAt: toDateTimeLocalValue(initialValue.closesAt),
  });

  const isRolling = form.recruitmentMode === "ROLLING";
  const submitLabel = mode === "create" ? "Create posting" : "Save changes";
  const questionEditorHref =
    mode === "edit" && jobPostingId
      ? `/admin/job-postings/${jobPostingId}/questions`
      : null;

  const payload = useMemo<AdminJobPostingPayload | null>(() => {
    if (!form.publicKey || !form.title || !form.headline || !form.description) {
      return null;
    }

    if (!form.opensAt) {
      return null;
    }

    if (!isRolling && !form.closesAt) {
      return null;
    }

    return {
      legacyAnnoId: form.legacyAnnoId ? Number(form.legacyAnnoId) : null,
      publicKey: form.publicKey.trim(),
      title: form.title.trim(),
      headline: form.headline.trim(),
      description: form.description.trim(),
      employmentType: form.employmentType.trim(),
      recruitmentCategory: form.recruitmentCategory,
      recruitmentMode: form.recruitmentMode,
      location: form.location.trim(),
      status: form.status,
      published: form.published,
      opensAt: toPayloadDateTime(form.opensAt),
      closesAt: isRolling ? null : toPayloadDateTime(form.closesAt),
    };
  }, [form, isRolling]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "recruitmentMode" && value === "ROLLING"
        ? { closesAt: "" }
        : {}),
    }));
  }

  function handleSubmit() {
    if (!payload) {
      setError("Complete all required fields before saving.");
      return;
    }

    startTransition(async () => {
      setError(null);
      setSaveMessage(null);

      try {
        const endpoint =
          mode === "create"
            ? "/api/admin/job-postings"
            : `/api/admin/job-postings/${jobPostingId}`;
        const method = mode === "create" ? "POST" : "PUT";
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = (await response.json().catch(() => null)) as
          | { id?: number; error?: string; message?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.message ?? data?.error ?? "Failed to save the posting.");
        }

        const targetId = data?.id ?? jobPostingId;
        setSaveMessage(mode === "create" ? "Job posting created." : "Job posting updated.");

        if (mode === "create" && targetId) {
          router.replace(`/admin/job-postings/${targetId}`);
          router.refresh();
          return;
        }

        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to save the posting.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-sm border border-outline-variant bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">Public key</span>
            <input
              value={form.publicKey}
              onChange={(event) => updateField("publicKey", event.target.value)}
              className={fieldClassName}
              placeholder="platform-backend-engineer"
              disabled={isPending}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">Legacy posting ID</span>
            <input
              value={form.legacyAnnoId}
              onChange={(event) => updateField("legacyAnnoId", event.target.value)}
              className={fieldClassName}
              placeholder="90101"
              disabled={isPending}
              inputMode="numeric"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-on-surface">Title</span>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className={fieldClassName}
              disabled={isPending}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-on-surface">Headline</span>
            <input
              value={form.headline}
              onChange={(event) => updateField("headline", event.target.value)}
              className={fieldClassName}
              disabled={isPending}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-on-surface">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className={`${fieldClassName} min-h-36 resize-y`}
              disabled={isPending}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">Employment type</span>
            <input
              value={form.employmentType}
              onChange={(event) => updateField("employmentType", event.target.value)}
              className={fieldClassName}
              placeholder="FULL_TIME"
              disabled={isPending}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">Location</span>
            <input
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
              className={fieldClassName}
              placeholder="Seoul"
              disabled={isPending}
            />
          </label>
        </div>
      </section>

      <section className="rounded-sm border border-outline-variant bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">Recruitment category</span>
            <select
              value={form.recruitmentCategory}
              onChange={(event) =>
                updateField(
                  "recruitmentCategory",
                  event.target.value as typeof form.recruitmentCategory,
                )
              }
              className={fieldClassName}
              disabled={isPending}
            >
              <option value="NEW_GRAD">New grad</option>
              <option value="EXPERIENCED">Experienced</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">Recruitment mode</span>
            <select
              value={form.recruitmentMode}
              onChange={(event) =>
                updateField(
                  "recruitmentMode",
                  event.target.value as typeof form.recruitmentMode,
                )
              }
              className={fieldClassName}
              disabled={isPending}
            >
              <option value="FIXED_TERM">Fixed term</option>
              <option value="ROLLING">Rolling</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value as typeof form.status)
              }
              className={fieldClassName}
              disabled={isPending}
            >
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">Published</span>
            <select
              value={form.published ? "true" : "false"}
              onChange={(event) =>
                updateField("published", event.target.value === "true")
              }
              className={fieldClassName}
              disabled={isPending}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">Opens at</span>
            <input
              type="datetime-local"
              value={form.opensAt}
              onChange={(event) => updateField("opensAt", event.target.value)}
              className={fieldClassName}
              disabled={isPending}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">Closes at</span>
            <input
              type="datetime-local"
              value={form.closesAt}
              onChange={(event) => updateField("closesAt", event.target.value)}
              className={fieldClassName}
              disabled={isPending || isRolling}
            />
            <p className="text-xs text-on-surface-variant">
              {isRolling
                ? "Rolling postings do not require a closing time."
                : "Set a closing time for fixed-term recruitment."}
            </p>
          </label>
        </div>
      </section>

      {error ? (
        <div className="rounded-sm border border-error/40 bg-error-container px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {saveMessage ? (
        <div className="rounded-sm border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          {saveMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-sm bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {submitLabel}
          </button>
          {questionEditorHref ? (
            <a
              href={questionEditorHref}
              className="rounded-sm border border-outline-variant px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
            >
              Edit questions
            </a>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-sm border border-outline-variant px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
