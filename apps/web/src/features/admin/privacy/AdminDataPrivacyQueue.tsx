"use client";

import { useState } from "react";

import type { AdminCandidateDataRequest } from "@/entities/admin/privacy-model";
import type { CandidateDataRequestStatus } from "@/entities/candidate/privacy-model";
import { formatDateTime } from "@/shared/lib/recruitment";

function nextStatuses(status: CandidateDataRequestStatus) {
  if (status === "REQUESTED") return ["IN_REVIEW", "REJECTED"] as const;
  if (status === "IN_REVIEW") return ["COMPLETED", "REJECTED"] as const;
  return [] as const;
}

export function AdminDataPrivacyQueue({ initialRequests }: { initialRequests: AdminCandidateDataRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(requestId: number, status: CandidateDataRequestStatus, note: string) {
    setPendingId(requestId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/data-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolutionNote: note }),
      });
      const body = (await response.json().catch(() => null)) as AdminCandidateDataRequest | { message?: string } | null;
      if (!response.ok) throw new Error(body && "message" in body ? body.message : "요청을 처리하지 못했습니다.");
      const updated = body as AdminCandidateDataRequest;
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "요청을 처리하지 못했습니다.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p role="alert" className="rounded-sm bg-error-container p-4 text-sm text-destructive">{error}</p> : null}
      {requests.length === 0 ? (
        <p className="rounded-sm border border-outline-variant bg-card p-8 text-sm text-on-surface-variant">개인정보 요청이 없습니다.</p>
      ) : requests.map((request) => (
        <DataRequestRow
          key={request.id}
          request={request}
          pending={pendingId === request.id}
          onUpdate={update}
        />
      ))}
    </div>
  );
}

function DataRequestRow({
  request,
  pending,
  onUpdate,
}: {
  request: AdminCandidateDataRequest;
  pending: boolean;
  onUpdate: (id: number, status: CandidateDataRequestStatus, note: string) => Promise<void>;
}) {
  const options = nextStatuses(request.status);
  const [targetStatus, setTargetStatus] = useState<CandidateDataRequestStatus | "">(options[0] ?? "");
  const [note, setNote] = useState(request.resolutionNote ?? "");

  return (
    <article className="rounded-sm border border-outline-variant bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-on-surface-variant">
            {request.requestType === "DATA_EXPORT" ? "데이터 내보내기" : "데이터 삭제"} · {request.status}
          </p>
          <h2 className="mt-2 text-lg font-semibold">{request.candidateName}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{request.candidateEmail} · {request.candidatePhone}</p>
          <p className="mt-2 text-xs text-outline">접수 {formatDateTime(request.requestedAt)}</p>
          {request.candidateMessage ? <p className="mt-3 whitespace-pre-line text-sm">{request.candidateMessage}</p> : null}
        </div>
      </div>

      {options.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
          <label className="text-sm font-medium">
            다음 상태
            <select
              value={targetStatus}
              onChange={(event) => setTargetStatus(event.target.value as CandidateDataRequestStatus)}
              disabled={pending}
              className="mt-2 w-full rounded-sm border border-outline-variant bg-card px-3 py-2"
            >
              {options.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            처리 메모
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={pending}
              maxLength={4000}
              className="mt-2 w-full rounded-sm border border-outline-variant bg-card px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={pending || !targetStatus || ((targetStatus === "COMPLETED" || targetStatus === "REJECTED") && !note.trim())}
            onClick={() => targetStatus && void onUpdate(request.id, targetStatus, note)}
            className="rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {pending ? "처리 중" : "상태 변경"}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-on-surface-variant">처리 메모: {request.resolutionNote ?? "-"}</p>
      )}
    </article>
  );
}
