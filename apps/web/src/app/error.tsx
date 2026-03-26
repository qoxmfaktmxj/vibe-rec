"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/25 bg-primary-container">
          <svg
            className="h-7 w-7 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="font-headline text-6xl font-light tracking-[-0.08em] text-on-surface">
          500
        </p>
        <div className="space-y-3">
          <h1 className="font-headline text-3xl font-medium tracking-[-0.05em] text-on-surface">
            문제가 발생했습니다
          </h1>
          <p className="max-w-xl text-sm leading-7 text-on-surface-variant">
            {error.message ||
              "예상하지 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="rounded-sm border border-outline-variant px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-on-surface"
          >
            홈으로 이동
          </Link>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-on-surface-variant">
          HireFlow
        </p>
      </div>
    </main>
  );
}
