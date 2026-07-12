"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type {
  AdminApplicantDetail,
  AdminApplicantOptions,
  AdminApplicantTag,
} from "@/entities/admin/applicant-model";

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? fallback;
}

export function ApplicantAssignmentPanel({
  applicationId,
  initialAssignedAdminId,
  initialTags,
  options,
  canManage,
}: {
  applicationId: number;
  initialAssignedAdminId: number | null;
  initialTags: AdminApplicantTag[];
  options: AdminApplicantOptions;
  canManage: boolean;
}) {
  const router = useRouter();
  const [assignedAdminId, setAssignedAdminId] = useState<number | null>(initialAssignedAdminId);
  const [tags, setTags] = useState(initialTags);
  const [tagName, setTagName] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyResponse(response: AdminApplicantDetail) {
    setAssignedAdminId(response.assignedAdminId);
    setTags(response.tags);
    router.refresh();
  }

  async function updateAssignee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/applicants/${applicationId}/assignee`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminAccountId: assignedAdminId }),
      });
      if (!response.ok) throw new Error(await responseError(response, "담당자를 변경하지 못했습니다."));
      applyResponse((await response.json()) as AdminApplicantDetail);
      setMessage("담당자를 변경했습니다.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "담당자를 변경하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function addTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tagName.trim()) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/applicants/${applicationId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName }),
      });
      if (!response.ok) throw new Error(await responseError(response, "태그를 추가하지 못했습니다."));
      applyResponse((await response.json()) as AdminApplicantDetail);
      setTagName("");
      setMessage("태그를 추가했습니다.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "태그를 추가하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function removeTag(tagId: number) {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/applicants/${applicationId}/tags/${tagId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await responseError(response, "태그를 제거하지 못했습니다."));
      applyResponse((await response.json()) as AdminApplicantDetail);
      setMessage("태그를 제거했습니다.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "태그를 제거하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-outline-variant/70 bg-card p-7">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">운영 책임</p>
        <h2 className="mt-2 font-headline text-2xl font-semibold tracking-[-0.05em] text-on-surface">담당자와 태그</h2>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant">
          담당자를 지정하고 분류 태그를 추가하면 목록 필터와 감사 이력에 즉시 반영됩니다.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={updateAssignee} className="space-y-3">
          <label htmlFor="applicant-assignee" className="block text-sm font-semibold text-on-surface-variant">
            담당자
          </label>
          <div className="flex gap-2">
            <select
              id="applicant-assignee"
              value={assignedAdminId ?? ""}
              onChange={(event) => setAssignedAdminId(event.target.value ? Number(event.target.value) : null)}
              disabled={!canManage || pending}
              className="min-w-0 flex-1 border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm"
            >
              <option value="">미배정</option>
              {options.assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>{assignee.displayName}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!canManage || pending}
              className="bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </form>

        <div>
          <p className="text-sm font-semibold text-on-surface-variant">태그</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.length === 0 ? <span className="text-sm text-on-surface-variant">등록된 태그 없음</span> : null}
            {tags.map((tag) => (
              <span key={tag.id} className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 text-xs font-medium">
                {tag.name}
                {canManage ? (
                  <button
                    type="button"
                    aria-label={`${tag.name} 태그 제거`}
                    disabled={pending}
                    onClick={() => void removeTag(tag.id)}
                    className="text-on-surface-variant hover:text-destructive disabled:opacity-50"
                  >
                    ×
                  </button>
                ) : null}
              </span>
            ))}
          </div>
          <form onSubmit={addTag} className="mt-4 flex gap-2">
            <label htmlFor="applicant-tag" className="sr-only">태그 이름</label>
            <input
              id="applicant-tag"
              value={tagName}
              onChange={(event) => setTagName(event.target.value)}
              list="applicant-tag-options"
              maxLength={80}
              disabled={!canManage || pending}
              placeholder="태그 이름"
              className="min-w-0 flex-1 border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm"
            />
            <datalist id="applicant-tag-options">
              {options.tags.map((tag) => <option key={tag.id} value={tag.name} />)}
            </datalist>
            <button
              type="submit"
              disabled={!canManage || pending || !tagName.trim()}
              className="border border-outline px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              추가
            </button>
          </form>
        </div>
      </div>

      {!canManage ? <p className="mt-4 text-xs text-on-surface-variant">현재 역할에는 담당자와 태그를 변경할 권한이 없습니다.</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
      {message ? <p role="status" aria-live="polite" className="mt-4 text-sm text-emerald-800">{message}</p> : null}
    </section>
  );
}
