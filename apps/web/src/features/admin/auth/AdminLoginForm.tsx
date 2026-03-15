"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-primary focus:ring-4 focus:ring-primary/10";

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
        setErrorMessage(responseBody.message ?? "Failed to sign in.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage("An unexpected error occurred while signing in.");
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
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-black/8 bg-white/88 p-8 shadow-[0_24px_80px_rgba(43,35,18,0.1)]"
    >
      <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
        Admin Session
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
        Sign in to the recruiter shell
      </h1>
      <p className="mt-3 text-sm leading-7 text-stone-600">
        This protects the Next.js admin shell with an HTTP-only session cookie.
        The local development account is prefilled for verification.
      </p>

      <div className="mt-6 rounded-[1.5rem] bg-stone-950 px-5 py-4 text-sm text-stone-100">
        <p className="font-medium">Development account</p>
        <p className="mt-2 text-stone-300">Username: admin</p>
        <p className="text-stone-300">Password: admin</p>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-[1.5rem] bg-rose-100 px-4 py-3 text-sm text-rose-900">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <label className="block text-sm font-medium text-stone-700">
          Username
          <input
            name="username"
            type="text"
            autoComplete="username"
            className={inputClassName}
            value={username}
            disabled={isPending}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-stone-700">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className={inputClassName}
            value={password}
            disabled={isPending}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
