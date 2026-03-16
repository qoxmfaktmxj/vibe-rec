"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="ambient-shadow w-full max-w-xl rounded-xl bg-surface-container-lowest p-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-error-container">
          <svg
            className="h-7 w-7 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">
          Something went wrong
        </h1>
        <p className="mt-4 text-sm leading-7 text-on-surface-variant">
          {error.message ||
            "The API or UI failed while processing the request."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-gradient-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
