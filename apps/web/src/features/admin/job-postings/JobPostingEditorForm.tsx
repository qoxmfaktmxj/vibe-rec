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

type FormState = {
  legacyAnnoId: string;
  publicKey: string;
  title: string;
  headline: string;
  description: string;
  employmentType: string;
  recruitmentCategory: AdminJobPostingPayload["recruitmentCategory"];
  recruitmentMode: AdminJobPostingPayload["recruitmentMode"];
  location: string;
  status: AdminJobPostingPayload["status"];
  published: boolean;
  opensAt: string;
  closesAt: string;
};

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

function createInitialFormState(initialValue: AdminJobPostingPayload): FormState {
  return {
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
  };
}

function getDisplayGroupLabel(form: Pick<FormState, "recruitmentCategory" | "recruitmentMode">) {
  if (form.recruitmentMode === "ROLLING") {
    return "상시 채용";
  }

  return form.recruitmentCategory === "NEW_GRAD" ? "신입 채용" : "경력 채용";
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
  const [form, setForm] = useState<FormState>(() =>
    createInitialFormState(initialValue),
  );

  const isRolling = form.recruitmentMode === "ROLLING";
  const displayGroupLabel = getDisplayGroupLabel(form);
  const submitLabel = mode === "create" ? "공고 등록" : "공고 저장";
  const questionEditorHref =
    mode === "edit" && jobPostingId
      ? `/admin/job-postings/${jobPostingId}/questions`
      : null;

  const payload = useMemo<AdminJobPostingPayload | null>(() => {
    const legacyAnnoId = form.legacyAnnoId.trim();

    if (
      !form.publicKey.trim() ||
      !form.title.trim() ||
      !form.headline.trim() ||
      !form.description.trim() ||
      !form.employmentType.trim() ||
      !form.location.trim() ||
      !form.opensAt
    ) {
      return null;
    }

    if (!isRolling && !form.closesAt) {
      return null;
    }

    if (legacyAnnoId && Number.isNaN(Number(legacyAnnoId))) {
      return null;
    }

    return {
      legacyAnnoId: legacyAnnoId ? Number(legacyAnnoId) : null,
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

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
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
      setError("필수 입력값을 모두 확인해 주세요.");
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
          throw new Error(
            data?.message ?? data?.error ?? "공고 저장에 실패했습니다.",
          );
        }

        const targetId = data?.id ?? jobPostingId;
        setSaveMessage(
          mode === "create"
            ? "공고를 등록했습니다."
            : "공고를 저장했습니다.",
        );

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
            : "공고 저장에 실패했습니다.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-sm border border-outline-variant bg-card p-6">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant pb-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              Posting setup
            </p>
            <h2 className="mt-2 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
              공고 기본 정보
            </h2>
          </div>
          <div className="rounded-sm border border-outline-variant bg-surface-container-low px-4 py-3 text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
              공개 섹션
            </p>
            <p className="mt-2 text-sm font-medium text-on-surface">
              {displayGroupLabel}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">공개 키</span>
            <input
              value={form.publicKey}
              onChange={(event) => updateField("publicKey", event.target.value)}
              className={fieldClassName}
              placeholder="platform-backend-engineer"
              disabled={isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">
              레거시 공고 ID
            </span>
            <input
              value={form.legacyAnnoId}
              onChange={(event) =>
                updateField("legacyAnnoId", event.target.value)
              }
              className={fieldClassName}
              placeholder="90101"
              disabled={isPending}
              inputMode="numeric"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-on-surface">공고 제목</span>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className={fieldClassName}
              disabled={isPending}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-on-surface">한 줄 소개</span>
            <input
              value={form.headline}
              onChange={(event) => updateField("headline", event.target.value)}
              className={fieldClassName}
              disabled={isPending}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-on-surface">공고 설명</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className={`${fieldClassName} min-h-36 resize-y`}
              disabled={isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">고용 형태</span>
            <input
              value={form.employmentType}
              onChange={(event) =>
                updateField("employmentType", event.target.value)
              }
              className={fieldClassName}
              placeholder="FULL_TIME"
              disabled={isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">근무지</span>
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
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant pb-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              Recruitment settings
            </p>
            <h2 className="mt-2 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
              채용 분류 및 일정
            </h2>
          </div>
          <p className="max-w-sm text-right text-sm leading-6 text-on-surface-variant">
            신입/경력은 채용 구분으로, 상시 채용은 모집 방식으로 결정됩니다.
            공개 사이트에서는 현재 설정 조합을 기준으로 섹션이 나뉩니다.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">채용 구분</span>
            <select
              value={form.recruitmentCategory}
              onChange={(event) =>
                updateField(
                  "recruitmentCategory",
                  event.target.value as FormState["recruitmentCategory"],
                )
              }
              className={fieldClassName}
              disabled={isPending}
            >
              <option value="NEW_GRAD">신입 채용</option>
              <option value="EXPERIENCED">경력 채용</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">모집 방식</span>
            <select
              value={form.recruitmentMode}
              onChange={(event) =>
                updateField(
                  "recruitmentMode",
                  event.target.value as FormState["recruitmentMode"],
                )
              }
              className={fieldClassName}
              disabled={isPending}
            >
              <option value="FIXED_TERM">기간 채용</option>
              <option value="ROLLING">상시 채용</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">상태</span>
            <select
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value as FormState["status"])
              }
              className={fieldClassName}
              disabled={isPending}
            >
              <option value="DRAFT">임시 저장</option>
              <option value="OPEN">모집 중</option>
              <option value="CLOSED">마감</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">공개 여부</span>
            <select
              value={form.published ? "true" : "false"}
              onChange={(event) =>
                updateField("published", event.target.value === "true")
              }
              className={fieldClassName}
              disabled={isPending}
            >
              <option value="true">공개</option>
              <option value="false">비공개</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">
              모집 시작 일시
            </span>
            <input
              type="datetime-local"
              value={form.opensAt}
              onChange={(event) => updateField("opensAt", event.target.value)}
              className={fieldClassName}
              disabled={isPending}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-on-surface">
              모집 마감 일시
            </span>
            <input
              type="datetime-local"
              value={form.closesAt}
              onChange={(event) => updateField("closesAt", event.target.value)}
              className={fieldClassName}
              disabled={isPending || isRolling}
            />
            <p className="text-xs leading-5 text-on-surface-variant">
              {isRolling
                ? "상시 채용은 마감 일시를 비워 둡니다."
                : "기간 채용은 마감 일시가 필요합니다."}
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
              질문 관리
            </a>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-sm border border-outline-variant px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-on-surface"
        >
          대시보드로
        </button>
      </div>
    </div>
  );
}
