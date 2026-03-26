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
        setErrorMessage(responseBody.message ?? "愿由ъ옄 ?몄쬆???ㅽ뙣?덉뒿?덈떎.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage("愿由ъ옄 ?몄쬆 以??덇린移??딆? ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setErrorMessage("?꾩씠?붿? 鍮꾨?踰덊샇瑜?紐⑤몢 ?낅젰?섏꽭??");
      return;
    }

    if (mode === "signup") {
      if (!displayName.trim()) {
        setErrorMessage("?쒖떆 ?대쫫???낅젰?섏꽭??");
        return;
      }

      if (password.length < 8) {
        setErrorMessage("鍮꾨?踰덊샇??8???댁긽?댁뼱???⑸땲??");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("鍮꾨?踰덊샇 ?뺤씤???쇱튂?섏? ?딆뒿?덈떎.");
        return;
      }
    }

    setIsPending(true);
    setErrorMessage(null);

    startTransition(() => {
      void submitAuth();
    });
  }

  return (
    <div className="space-y-6">
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
          濡쒓렇??
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
          愿由ъ옄 怨꾩젙 ?앹꽦
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
              ?쒖떆 ?대쫫
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              placeholder="梨꾩슜 ?댁쁺 愿由ъ옄"
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
            ?꾩씠??
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
            鍮꾨?踰덊샇
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="鍮꾨?踰덊샇瑜??낅젰?섏꽭??
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
              鍮꾨?踰덊샇 ?뺤씤
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="鍮꾨?踰덊샇瑜??ㅼ떆 ?낅젰?섏꽭??
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
              ? "怨꾩젙 ?앹꽦 以?.."
              : "濡쒓렇??以?.."
            : mode === "signup"
              ? "愿由ъ옄 怨꾩젙 留뚮뱾湲?
              : "濡쒓렇??}
        </button>
      </form>
    </div>
  );
}

