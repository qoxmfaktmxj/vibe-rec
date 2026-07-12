"use client";

import { useState } from "react";

import type {
  CandidateDataRequest,
  CandidateDataRequestStatus,
  CandidateDataRequestType,
} from "@/entities/candidate/privacy-model";
import { formatDateTime } from "@/shared/lib/recruitment";

const typeLabel: Record<CandidateDataRequestType, string> = {
  DATA_EXPORT: "내 데이터 내보내기",
  DATA_DELETION: "내 데이터 삭제",
};

const statusLabel: Record<CandidateDataRequestStatus, string> = {
  REQUESTED: "접수됨",
  IN_REVIEW: "검토 중",
  COMPLETED: "완료",
  REJECTED: "거절됨",
  CANCELLED: "취소됨",
};

export function CandidateDataRequestPanel({
  initialRequests,
}: {
  initialRequests: CandidateDataRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [requestType, setRequestType] = useState<CandidateDataRequestType>("DATA_EXPORT");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRequest(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/candidate/data-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType, message }),
      });
      const body = (await response.json().catch(() => null)) as CandidateDataRequest | { message?: string } | null;
      if (!response.ok) {
        throw new Error(body && "message" in body ? body.message : "요청을 등록하지 못했습니다.");
      }
      setRequests((current) => [body as CandidateDataRequest, ...current]);
      setMessage("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "요청을 등록하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function cancelRequest(requestId: number) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/candidate/data-requests/${requestId}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as CandidateDataRequest | { message?: string } | null;
      if (!response.ok) {
        throw new Error(body && "message" in body ? body.message : "요청을 취소하지 못했습니다.");
      }
      const updated = body as CandidateDataRequest;
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "요청을 취소하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-sm border border-outline-variant bg-card p-6">
      <h2 className="font-headline text-lg font-medium tracking-[-0.04em]">개인정보 요청</h2>
      <p className="mt-1 text-sm leading-6 text-on-surface-variant">
        계정과 지원 내역의 사본을 요청하거나 삭제 검토를 요청할 수 있습니다. 삭제 요청은 법적 보존 의무 확인 후 처리됩니다.
      </p>

      <form onSubmit={createRequest} className="mt-5 grid gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
        <label className="text-sm font-medium">
          요청 유형
          <select
            value={requestType}
            onChange={(event) => setRequestType(event.target.value as CandidateDataRequestType)}
            disabled={pending}
            className="mt-2 w-full rounded-sm border border-outline-variant bg-card px-3 py-2"
          >
            <option value="DATA_EXPORT">내 데이터 내보내기</option>
            <option value="DATA_DELETION">내 데이터 삭제</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          요청 메모
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={2000}
            disabled={pending}
            className="mt-2 w-full rounded-sm border border-outline-variant bg-card px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          요청 등록
        </button>
      </form>
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}

      {requests.length > 0 ? (
        <ul className="mt-6 divide-y divide-outline-variant">
          {requests.map((request) => (
            <li key={request.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{typeLabel[request.requestType]}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {statusLabel[request.status]} · {formatDateTime(request.requestedAt)}
                  </p>
                  {request.candidateMessage ? <p className="mt-2 text-sm text-on-surface-variant">{request.candidateMessage}</p> : null}
                  {request.resolutionNote ? <p className="mt-2 text-sm">처리 메모: {request.resolutionNote}</p> : null}
                </div>
                {request.status === "REQUESTED" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void cancelRequest(request.id)}
                    className="text-xs font-medium text-destructive underline-offset-4 hover:underline"
                  >
                    요청 취소
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
