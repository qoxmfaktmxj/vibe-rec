"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "w-full rounded-sm border border-outline-variant bg-card px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        setErrorMessage(responseBody.message ?? "Admin login failed.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage("A network error occurred while logging in.");
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setErrorMessage("Enter both username and password.");
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
          Username
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
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className={inputClassName}
          value={password}
          disabled={isPending}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-sm bg-primary py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
