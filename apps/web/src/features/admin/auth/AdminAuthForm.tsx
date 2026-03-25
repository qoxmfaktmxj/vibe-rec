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
        setErrorMessage(responseBody.message ?? "Admin authentication failed.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage("An unexpected error occurred during admin authentication.");
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

    if (mode === "signup") {
      if (!displayName.trim()) {
        setErrorMessage("Enter a display name.");
        return;
      }

      if (password.length < 8) {
        setErrorMessage("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("Password confirmation does not match.");
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
          Sign in
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
          Sign up
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
              Display name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              placeholder="Hiring Admin"
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
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Enter your password"
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
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
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
              ? "Creating account.."
              : "Signing in.."
            : mode === "signup"
              ? "Create admin account"
              : "Sign in"}
        </button>
      </form>
    </div>
  );
}
