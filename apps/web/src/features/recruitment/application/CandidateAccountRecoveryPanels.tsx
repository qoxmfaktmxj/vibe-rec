"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "w-full rounded-lg border border-outline-variant bg-card px-3.5 py-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20";

export function EmailVerificationPanel({ token, nextPath }: { token?: string; nextPath: string }) {
  const started = useRef(false);
  const [status, setStatus] = useState<"waiting" | "confirming" | "verified" | "error">(
    token ? "confirming" : "waiting",
  );
  const [message, setMessage] = useState(
    token ? "이메일 주소를 확인하고 있습니다." : "가입한 이메일로 보낸 확인 링크를 열어 주세요.",
  );
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    void (async () => {
      const response = await fetch("/api/candidate/auth/email-verification/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (response.ok) {
        setStatus("verified");
        setMessage("이메일 확인이 완료되었습니다. 지원서를 제출할 수 있습니다.");
      } else {
        setStatus("error");
        setMessage(body?.message ?? "확인 링크가 만료되었거나 이미 사용되었습니다.");
      }
    })();
  }, [token]);

  async function resend() {
    setIsPending(true);
    const response = await fetch("/api/candidate/auth/email-verification", { method: "POST" });
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    if (response.ok) {
      setStatus("waiting");
      setMessage("새 확인 메일을 전송 대기열에 등록했습니다.");
    } else {
      setStatus("error");
      setMessage(body?.message ?? "확인 메일을 다시 보내지 못했습니다.");
    }
    setIsPending(false);
  }

  return (
    <div className="space-y-5">
      <p
        role={status === "error" ? "alert" : "status"}
        aria-live="polite"
        className={`rounded-lg px-4 py-3 text-sm leading-7 ${
          status === "error" ? "bg-error-container text-destructive" : "bg-primary-container text-on-surface"
        }`}
      >
        {message}
      </p>
      {status === "verified" ? (
        <Link
          href={nextPath}
          className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground focus:ring-2 focus:ring-primary/20"
        >
          계속하기
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => void resend()}
          disabled={isPending || status === "confirming"}
          className="min-h-[44px] w-full rounded-lg border border-primary/30 bg-card px-5 py-2.5 text-sm font-semibold text-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        >
          {isPending ? "재발송 중…" : "확인 메일 다시 보내기"}
        </button>
      )}
      <Link href="/auth/login" className="block text-center text-sm text-on-surface-variant hover:text-primary">
        로그인으로 돌아가기
      </Link>
    </div>
  );
}

export function ForgotPasswordPanel() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    const response = await fetch("/api/candidate/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    if (response.ok) {
      setMessage("계정이 존재하면 비밀번호 재설정 메일이 발송됩니다.");
    } else {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "요청을 처리하지 못했습니다.");
    }
    setIsPending(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm font-semibold text-on-surface-variant">
        가입 이메일
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isPending}
          className={`mt-2 ${inputClassName}`}
        />
      </label>
      {message ? <p role="status" aria-live="polite" className="rounded-lg bg-primary-container px-4 py-3 text-sm text-on-surface">{message}</p> : null}
      <button type="submit" disabled={isPending} className="min-h-[44px] w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
        {isPending ? "요청 중…" : "재설정 링크 요청"}
      </button>
      <Link href="/auth/login" className="block text-center text-sm text-on-surface-variant hover:text-primary">
        로그인으로 돌아가기
      </Link>
    </form>
  );
}

export function ResetPasswordPanel({ token }: { token?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(token ? null : "재설정 토큰이 없습니다.");
  const [isPending, setIsPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmation) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setIsPending(true);
    setError(null);
    const response = await fetch("/api/candidate/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    if (!response.ok) {
      setError(body?.message ?? "비밀번호를 재설정하지 못했습니다.");
      setIsPending(false);
      return;
    }
    router.replace("/me");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-destructive">{error}</p> : null}
      <label className="block text-sm font-semibold text-on-surface-variant">
        새 비밀번호
        <input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={isPending || !token} className={`mt-2 ${inputClassName}`} />
      </label>
      <label className="block text-sm font-semibold text-on-surface-variant">
        새 비밀번호 확인
        <input type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={isPending || !token} className={`mt-2 ${inputClassName}`} />
      </label>
      <button type="submit" disabled={isPending || !token} className="min-h-[44px] w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
        {isPending ? "변경 중…" : "비밀번호 재설정"}
      </button>
    </form>
  );
}
