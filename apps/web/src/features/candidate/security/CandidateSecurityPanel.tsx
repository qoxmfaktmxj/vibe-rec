"use client";

import { useState } from "react";

import type { CandidateAccountSession } from "@/entities/candidate/model";

function describeUserAgent(userAgent: string) {
  if (!userAgent || userAgent === "Unknown") return "알 수 없는 기기";

  const browser = userAgent.includes("Edg/")
    ? "Microsoft Edge"
    : userAgent.includes("Firefox/")
      ? "Firefox"
      : userAgent.includes("Chrome/")
        ? "Chrome"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "브라우저";
  const device = userAgent.includes("Android")
    ? "Android"
    : userAgent.includes("iPhone") || userAgent.includes("iPad")
      ? "iOS"
      : userAgent.includes("Windows")
        ? "Windows"
        : userAgent.includes("Mac OS")
          ? "macOS"
          : userAgent.includes("Linux")
            ? "Linux"
            : "기기 정보 없음";

  return `${browser} · ${device}`;
}

async function errorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? fallback;
}

export function CandidateSecurityPanel({
  initialSessions,
}: {
  initialSessions: CandidateAccountSession[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const otherSessionCount = sessions.filter((session) => !session.current).length;

  async function refreshSessions() {
    const response = await fetch("/api/candidate/auth/sessions", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(await errorMessage(response, "활성 세션을 새로고침하지 못했습니다."));
    }
    setSessions((await response.json()) as CandidateAccountSession[]);
  }

  async function revokeSession(sessionId: number) {
    setPendingAction(`session-${sessionId}`);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/candidate/auth/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await errorMessage(response, "세션을 로그아웃하지 못했습니다."));
      }
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setSuccess("선택한 세션을 로그아웃했습니다.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "세션을 로그아웃하지 못했습니다.");
    } finally {
      setPendingAction(null);
    }
  }

  async function revokeOtherSessions() {
    setPendingAction("others");
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/candidate/auth/sessions/others", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await errorMessage(response, "다른 세션을 로그아웃하지 못했습니다."));
      }
      setSessions((current) => current.filter((session) => session.current));
      setSuccess("현재 기기를 제외한 모든 세션을 로그아웃했습니다.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "다른 세션을 로그아웃하지 못했습니다.");
    } finally {
      setPendingAction(null);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== passwordConfirmation) {
      setError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setPendingAction("password");
    try {
      const response = await fetch("/api/candidate/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        throw new Error(await errorMessage(response, "비밀번호를 변경하지 못했습니다."));
      }
      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirmation("");
      await refreshSessions();
      setSuccess("비밀번호를 변경하고 다른 모든 세션을 로그아웃했습니다.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "비밀번호를 변경하지 못했습니다.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="rounded-sm border border-outline-variant bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-lg font-medium tracking-[-0.04em]">계정 보안</h2>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">
            로그인된 기기를 확인하고 비밀번호를 변경할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          disabled={otherSessionCount === 0 || pendingAction !== null}
          onClick={() => void revokeOtherSessions()}
          className="rounded-sm border border-outline-variant px-4 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          다른 세션 모두 로그아웃
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold">활성 세션</h3>
        <ul className="mt-3 divide-y divide-outline-variant border-y border-outline-variant">
          {sessions.map((session) => (
            <li key={session.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-medium">
                  {describeUserAgent(session.userAgent)}
                  {session.current ? (
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                      현재 세션
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  최근 활동 {new Date(session.lastSeenAt).toLocaleString("ko-KR")} · 만료 {new Date(session.expiresAt).toLocaleString("ko-KR")}
                </p>
              </div>
              {!session.current ? (
                <button
                  type="button"
                  disabled={pendingAction !== null}
                  onClick={() => void revokeSession(session.id)}
                  className="text-xs font-medium text-destructive underline-offset-4 hover:underline disabled:opacity-50"
                >
                  이 세션 로그아웃
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={changePassword} className="mt-8 max-w-xl space-y-4">
        <div>
          <h3 className="text-sm font-semibold">비밀번호 변경</h3>
          <p className="mt-1 text-xs leading-5 text-on-surface-variant">
            변경하면 현재 기기를 제외한 기존 세션은 모두 로그아웃됩니다.
          </p>
        </div>
        <label className="block text-sm font-medium">
          현재 비밀번호
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={120}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={pendingAction !== null}
            className="mt-2 w-full rounded-sm border border-outline-variant bg-card px-3 py-2"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium">
            새 비밀번호
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={120}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={pendingAction !== null}
              className="mt-2 w-full rounded-sm border border-outline-variant bg-card px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            새 비밀번호 확인
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={120}
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              disabled={pendingAction !== null}
              className="mt-2 w-full rounded-sm border border-outline-variant bg-card px-3 py-2"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={pendingAction !== null}
          className="rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pendingAction === "password" ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>

      {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
      {success ? <p role="status" aria-live="polite" className="mt-4 text-sm text-emerald-800">{success}</p> : null}
    </section>
  );
}
