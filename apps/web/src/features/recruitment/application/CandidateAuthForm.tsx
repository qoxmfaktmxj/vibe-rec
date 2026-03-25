"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "w-full rounded-sm border border-outline-variant bg-card px-4 py-3 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary";

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
        setErrorMessage(responseBody.message ?? "Candidate authentication failed.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setErrorMessage("An unexpected error occurred during candidate authentication.");
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage("Enter both email and password.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim() || !phone.trim()) {
        setErrorMessage("Enter name and phone number.");
        return;
      }

      if (password.length < 8) {
        setErrorMessage("Password must be at least 8 characters.");
        return;
      }

      if (!/^[0-9+\-() ]{8,40}$/.test(phone.trim())) {
        setErrorMessage("Enter a valid phone number.");
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
          Log in
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
              htmlFor="candidate-name"
            >
              Name
            </label>
            <input
              id="candidate-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Kim"
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
            Email
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
              Phone
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
            Password
          </label>
          <input
            id="candidate-password"
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
              htmlFor="candidate-confirm-password"
            >
              Confirm password
            </label>
            <input
              id="candidate-confirm-password"
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
              : "Logging in.."
            : mode === "signup"
              ? "Create candidate account"
              : "Log in"}
        </button>
      </form>
    </div>
  );
}
