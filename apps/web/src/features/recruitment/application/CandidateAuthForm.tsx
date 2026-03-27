"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "w-full rounded-sm border border-outline-variant bg-card px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20";

type CandidateAuthMode = "login" | "signup";

export function CandidateAuthForm({
  defaultMode,
  nextPath,
}: {
  defaultMode: CandidateAuthMode;
  nextPath: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<CandidateAuthMode>(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function switchMode(nextMode: CandidateAuthMode) {
    setMode(nextMode);
    setErrorMessage(null);
  }

  async function submitAuth() {
    try {
      const response = await fetch(
        mode === "signup" ? "/api/candidate/auth/signup" : "/api/candidate/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "signup"
              ? {
                  name: name.trim(),
                  email: email.trim(),
                  phone: phone.trim(),
                  password,
                }
              : {
                  email: email.trim(),
                  password,
                },
          ),
        },
      );

      const responseBody = (await response.json()) as { message?: string };
      if (!response.ok) {
        setErrorMessage(responseBody.message ?? "지원자 인증에 실패했습니다.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setErrorMessage("지원자 인증 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim() || !phone.trim()) {
        setErrorMessage("이름과 휴대전화를 입력해 주세요.");
        return;
      }

      if (password.length < 8) {
        setErrorMessage("비밀번호는 8자 이상이어야 합니다.");
        return;
      }

      if (!/^[0-9+\-() ]{8,40}$/.test(phone.trim())) {
        setErrorMessage("유효한 휴대전화 번호를 입력해 주세요.");
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
          eyebrow: "새 지원자 계정",
          title: "지원자 회원가입",
          description: "계정을 만들면 저장한 지원서와 지원 이력을 한 곳에서 관리할 수 있습니다.",
        }
      : {
          eyebrow: "기존 지원자 계정",
          title: "지원자 로그인",
          description: "이전에 저장한 지원서와 제출 내역을 이어서 확인할 수 있습니다.",
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
              htmlFor="candidate-name"
            >
              이름
            </label>
            <input
              id="candidate-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="홍길동"
              className={inputClassName}
              value={name}
              disabled={isPending}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            className="ml-1 block text-sm font-semibold text-on-surface-variant"
            htmlFor="candidate-email"
          >
            이메일
          </label>
          <input
            id="candidate-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="applicant@example.com"
            className={inputClassName}
            value={email}
            disabled={isPending}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        {mode === "signup" ? (
          <div className="space-y-2">
            <label
              className="ml-1 block text-sm font-semibold text-on-surface-variant"
              htmlFor="candidate-phone"
            >
              휴대전화
            </label>
            <input
              id="candidate-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="010-1234-5678"
              className={inputClassName}
              value={phone}
              disabled={isPending}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            className="ml-1 block text-sm font-semibold text-on-surface-variant"
            htmlFor="candidate-password"
          >
            비밀번호
          </label>
          <input
            id="candidate-password"
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
              htmlFor="candidate-confirm-password"
            >
              비밀번호 확인
            </label>
            <input
              id="candidate-confirm-password"
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
              ? "가입하기"
              : "로그인"}
        </button>
      </form>
    </div>
  );
}
