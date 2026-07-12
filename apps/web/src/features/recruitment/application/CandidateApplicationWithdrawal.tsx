"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CandidateApplicationWithdrawalProps {
  applicationId: number;
  canWithdraw: boolean;
  withdrawnAt: string | null;
  withdrawalReason: string | null;
}

export function CandidateApplicationWithdrawal({
  applicationId,
  canWithdraw,
  withdrawnAt,
  withdrawalReason,
}: CandidateApplicationWithdrawalProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (withdrawnAt) {
    return (
      <div className="mt-5 rounded-sm border border-outline-variant bg-surface-container-low p-4 text-sm">
        <p className="font-semibold text-on-surface">지원이 철회되었습니다.</p>
        <p className="mt-1 text-on-surface-variant">
          {new Date(withdrawnAt).toLocaleString("ko-KR")}
        </p>
        {withdrawalReason ? (
          <p className="mt-2 whitespace-pre-line text-on-surface-variant">
            사유: {withdrawalReason}
          </p>
        ) : null}
      </div>
    );
  }

  if (!canWithdraw) {
    return null;
  }

  async function withdraw() {
    if (!confirmed || !reason.trim()) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/candidate/applications/${applicationId}/withdraw`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() }),
        },
      );
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(body?.message ?? "지원을 철회하지 못했습니다.");
      }
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "지원을 철회하지 못했습니다.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5 border-t border-outline-variant pt-5">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm font-medium text-destructive underline-offset-4 hover:underline"
        >
          지원 철회
        </button>
      ) : (
        <div className="max-w-xl space-y-4 rounded-sm border border-destructive/30 bg-error-container p-5">
          <div>
            <h3 className="font-semibold text-on-surface">지원을 철회하시겠습니까?</h3>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">
              예정된 면접이 취소되고 채용 절차가 종료됩니다. 철회 후에는 지원서를 다시 수정할 수 없습니다.
            </p>
          </div>
          <label className="block text-sm font-medium text-on-surface">
            철회 사유
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              rows={3}
              disabled={pending}
              className="mt-2 w-full rounded-sm border border-outline-variant bg-card px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-start gap-3 text-sm text-on-surface">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={pending}
              className="mt-1"
            />
            철회 후 채용 절차가 종료되는 것을 확인했습니다.
          </label>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={pending || !confirmed || !reason.trim()}
              onClick={() => void withdraw()}
              className="rounded-sm bg-destructive px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {pending ? "철회 처리 중" : "지원 철회 확정"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setExpanded(false)}
              className="rounded-sm border border-outline-variant px-4 py-2 text-sm font-medium"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
