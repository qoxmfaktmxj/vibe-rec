"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fcfbf7_0%,_#f3efe5_48%,_#ebe5d8_100%)] px-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-black/8 bg-white/88 p-10 shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
        <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
          Unexpected Error
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          Something went wrong while loading the screen.
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          {error.message || "The API or UI failed while processing the request."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
