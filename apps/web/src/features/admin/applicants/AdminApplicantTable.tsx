"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  AdminApplicantOptions,
  AdminApplicantSummary,
  BulkApplicantOperation,
  BulkApplicantOperationPayload,
  BulkApplicantOperationResponse,
} from "@/entities/admin/applicant-model";
import {
  formatDateTime,
  getApplicationReviewStatusClassName,
  getApplicationReviewStatusLabel,
  getApplicationStatusClassName,
  getApplicationStatusLabel,
} from "@/shared/lib/recruitment";

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? fallback;
}

export function AdminApplicantTable({
  applicants,
  options,
  canManage,
}: {
  applicants: AdminApplicantSummary[];
  options: AdminApplicantOptions;
  canManage: boolean;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [operation, setOperation] = useState<BulkApplicantOperation>("ASSIGN");
  const [assigneeId, setAssigneeId] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagId, setTagId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (applicants.length === 0) {
    return (
      <div className="border-t border-outline-variant px-6 py-14 text-center">
        <p className="font-headline text-2xl font-semibold tracking-[-0.02em] text-on-surface">
          현재 조건에 맞는 지원자가 없습니다.
        </p>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">
          검색 조건을 조정하거나 필터를 해제한 뒤 다시 확인해 주세요.
        </p>
      </div>
    );
  }

  const allSelected = selectedIds.length === applicants.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : applicants.map((applicant) => applicant.applicationId));
  }

  function toggleOne(applicationId: number) {
    setSelectedIds((current) => current.includes(applicationId)
      ? current.filter((id) => id !== applicationId)
      : [...current, applicationId]);
  }

  async function runBulkOperation() {
    if (selectedIds.length === 0) return;
    const payload: BulkApplicantOperationPayload = { applicationIds: selectedIds, operation };
    if (operation === "ASSIGN") payload.adminAccountId = assigneeId ? Number(assigneeId) : null;
    if (operation === "ADD_TAG") {
      if (!tagName.trim()) {
        setError("추가할 태그 이름을 입력해 주세요.");
        return;
      }
      payload.tagName = tagName;
    }
    if (operation === "REMOVE_TAG") {
      if (!tagId) {
        setError("제거할 태그를 선택해 주세요.");
        return;
      }
      payload.tagId = Number(tagId);
    }

    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/applicants/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await responseError(response, "일괄 작업을 처리하지 못했습니다."));
      const result = (await response.json()) as BulkApplicantOperationResponse;
      setMessage(`${result.requestedCount}명 중 ${result.changedCount}명의 정보가 변경되었습니다.`);
      setSelectedIds([]);
      setTagName("");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "일괄 작업을 처리하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {canManage ? (
        <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <p className="min-w-[90px] pb-2 text-sm font-semibold text-on-surface">{selectedIds.length}명 선택</p>
            <label className="text-xs font-semibold text-on-surface-variant">
              일괄 작업
              <select value={operation} onChange={(event) => setOperation(event.target.value as BulkApplicantOperation)} disabled={pending} className="mt-1 block rounded-lg border border-outline-variant bg-card px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-ring/25">
                <option value="ASSIGN">담당자 배정</option>
                <option value="ADD_TAG">태그 추가</option>
                <option value="REMOVE_TAG">태그 제거</option>
              </select>
            </label>
            {operation === "ASSIGN" ? (
              <label className="text-xs font-semibold text-on-surface-variant">
                담당자
                <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} disabled={pending} className="mt-1 block rounded-lg border border-outline-variant bg-card px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-ring/25">
                  <option value="">미배정</option>
                  {options.assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.displayName}</option>)}
                </select>
              </label>
            ) : null}
            {operation === "ADD_TAG" ? (
              <label className="text-xs font-semibold text-on-surface-variant">
                태그 이름
                <input value={tagName} onChange={(event) => setTagName(event.target.value)} list="bulk-tag-options" maxLength={80} disabled={pending} className="mt-1 block rounded-lg border border-outline-variant bg-card px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-ring/25" />
                <datalist id="bulk-tag-options">{options.tags.map((tag) => <option key={tag.id} value={tag.name} />)}</datalist>
              </label>
            ) : null}
            {operation === "REMOVE_TAG" ? (
              <label className="text-xs font-semibold text-on-surface-variant">
                제거할 태그
                <select value={tagId} onChange={(event) => setTagId(event.target.value)} disabled={pending} className="mt-1 block rounded-lg border border-outline-variant bg-card px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-ring/25">
                  <option value="">선택</option>
                  {options.tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                </select>
              </label>
            ) : null}
            <button type="button" onClick={() => void runBulkOperation()} disabled={pending || selectedIds.length === 0} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50">
              {pending ? "처리 중..." : "선택 항목 적용"}
            </button>
          </div>
          {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
          {message ? <p role="status" aria-live="polite" className="mt-3 text-sm text-emerald-800">{message}</p> : null}
        </div>
      ) : null}

      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">필터 조건에 해당하는 지원자 목록</caption>
          <thead className="sticky top-0 z-10 bg-surface-container-low">
            <tr className="border-b border-outline-variant text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              {canManage ? (
                <th scope="col" className="px-4 py-4">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="현재 페이지 지원자 전체 선택" />
                </th>
              ) : null}
              <th scope="col" className="px-6 py-4">지원자</th>
              <th scope="col" className="px-6 py-4">공고</th>
              <th scope="col" className="px-6 py-4">지원 상태</th>
              <th scope="col" className="px-6 py-4">검토 상태</th>
              <th scope="col" className="px-6 py-4">담당자·태그</th>
              <th scope="col" className="px-6 py-4">최근 활동</th>
              <th scope="col" className="px-6 py-4 text-right">열기</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant) => {
              const activityTimestamp =
                applicant.reviewedAt ?? applicant.submittedAt ?? applicant.draftSavedAt;

              return (
                <tr
                  key={applicant.applicationId}
                  className="border-b border-outline-variant/70 align-top transition-colors hover:bg-surface-container-low/60 last:border-b-0"
                >
                  {canManage ? (
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selectedIds.includes(applicant.applicationId)} onChange={() => toggleOne(applicant.applicationId)} aria-label={`${applicant.applicantName} 선택`} />
                    </td>
                  ) : null}
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <p className="text-base font-semibold text-on-surface">{applicant.applicantName}</p>
                      <p className="text-sm text-on-surface-variant">{applicant.applicantEmail}</p>
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] tabular-nums text-on-surface-variant">{applicant.applicantPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-on-surface">{applicant.jobPostingTitle}</p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-on-surface-variant">지원서 #{applicant.applicationId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${getApplicationStatusClassName(applicant.applicationStatus)}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {getApplicationStatusLabel(applicant.applicationStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${getApplicationReviewStatusClassName(applicant.reviewStatus)}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {getApplicationReviewStatusLabel(applicant.reviewStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-on-surface">{applicant.assignedAdminName ?? "미배정"}</p>
                    <div className="mt-2 flex max-w-[220px] flex-wrap gap-1.5">
                      {applicant.tags.map((tag) => <span key={tag.id} className="rounded-full bg-surface-container-high px-2 py-1 text-[11px] text-on-surface-variant">{tag.name}</span>)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    <p className="tabular-nums">{formatDateTime(activityTimestamp)}</p>
                    <p className="mt-1 text-xs tabular-nums">제출 시각: {formatDateTime(applicant.submittedAt)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/applicants/${applicant.applicationId}`} className="inline-flex items-center justify-center rounded-lg border border-outline px-3.5 py-2 text-xs font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground">보기</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
