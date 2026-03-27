"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "w-full rounded-sm border border-outline-variant bg-card px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary";

type AdminAuthMode = "login" | "signup";

export function AdminAuthForm({
  defaultMode,
}: {
  defaultMode: AdminAuthMode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AdminAuthMode>(defaultMode);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function switchMode(nextMode: AdminAuthMode) {
    setMode(nextMode);
    setErrorMessage(null);
  }

  async function submitAuth() {
    try {
      const response = await fetch(
        mode === "signup" ? "/api/admin/auth/signup" : "/api/admin/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "signup"
              ? {
                  username: username.trim(),
                  displayName: displayName.trim(),
                  password,
                }
              : {
                  username: username.trim(),
                  password,
                },
          ),
        },
      );

      const responseBody = (await response.json()) as { message?: string };
      if (!response.ok) {
        setErrorMessage(responseBody.message ?? "관리자 인증에 실패했습니다.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage("요청 처리 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setErrorMessage("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    if (mode === "signup") {
      if (!displayName.trim()) {
        setErrorMessage("표시 이름을 입력해 주세요.");
        return;
      }

      if (password.length < 8) {
        setErrorMessage("비밀번호는 8자 이상이어야 합니다.");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    setIsPending(true);
    setErrorMessage(null);

    startTransition(() => {
      void submitAuth();
    });
  }

  const modeCopy =
    mode === "signup"
      ? {
          eyebrow: "새 관리자 계정",
          title: "관리자 회원가입",
          description: "채용 운영 워크스페이스를 새로 열고 바로 대시보드로 이동합니다.",
        }
      : {
          eyebrow: "기존 관리자 계정",
          title: "관리자 로그인",
          description: "기존 계정으로 로그인해 공고와 지원자 현황을 이어서 관리합니다.",
        };

  return (
    <div className="space-y-6">
      <div aria-live="polite" aria-atomic="true" className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
          {modeCopy.eyebrow}
        </p>
        <div className="space-y-1">
          <h2 className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            {modeCopy.title}
          </h2>
          <p className="text-sm leading-6 text-on-surface-variant">
            {modeCopy.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-sm bg-surface-container-low p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-primary text-primary-foreground"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
            mode === "signup"
              ? "bg-primary text-primary-foreground"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          회원가입
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage ? (
          <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {mode === "signup" ? (
          <div className="space-y-2">
            <label
              className="ml-1 block text-sm font-semibold text-on-surface-variant"
              htmlFor="displayName"
            >
              표시 이름
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              placeholder="채용 관리자"
              className={inputClassName}
              value={displayName}
              disabled={isPending}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            className="ml-1 block text-sm font-semibold text-on-surface-variant"
            htmlFor="username"
          >
            아이디
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="admin"
            className={inputClassName}
            value={username}
            disabled={isPending}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label
            className="ml-1 block text-sm font-semibold text-on-surface-variant"
            htmlFor="password"
          >
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="비밀번호를 입력해 주세요"
            className={inputClassName}
            value={password}
            disabled={isPending}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {mode === "signup" ? (
          <div className="space-y-2">
            <label
              className="ml-1 block text-sm font-semibold text-on-surface-variant"
              htmlFor="confirmPassword"
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호를 다시 입력해 주세요"
              className={inputClassName}
              value={confirmPassword}
              disabled={isPending}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-sm bg-primary py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? mode === "signup"
              ? "가입 처리 중..."
              : "로그인 중..."
            : mode === "signup"
              ? "관리자 계정 만들기"
              : "로그인"}
        </button>
      </form>
    </div>
  );
}
