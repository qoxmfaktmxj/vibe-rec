"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "w-full rounded-lg border-none bg-surface-container-highest px-4 py-4 text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function submitLogin() {
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const responseBody = (await response.json()) as { message?: string };
      if (!response.ok) {
        setErrorMessage(responseBody.message ?? "로그인에 실패했습니다.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage("로그인 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setErrorMessage("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    startTransition(() => {
      void submitLogin();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage ? (
        <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-destructive">
          {errorMessage}
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
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputClassName}
          value={password}
          disabled={isPending}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-gradient-primary py-4 font-bold text-white shadow-xl shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
