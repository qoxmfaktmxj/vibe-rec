import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low">
          <svg
            className="h-7 w-7 text-outline"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <p className="font-headline text-6xl font-light tracking-[-0.08em] text-on-surface">
          404
        </p>
        <div className="space-y-3">
          <h1 className="font-headline text-3xl font-medium tracking-[-0.05em] text-on-surface">
            Page Not Found
          </h1>
          <p className="max-w-lg text-sm leading-7 text-on-surface-variant">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground"
          >
            Back to Home
          </Link>
          <Link
            href="/"
            className="rounded-sm border border-outline-variant px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-on-surface"
          >
            Browse Jobs
          </Link>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-on-surface-variant">
          Vibe Rec
        </p>
      </div>
    </main>
  );
}
