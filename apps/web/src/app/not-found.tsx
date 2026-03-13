import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fcfbf7_0%,_#f3efe5_48%,_#ebe5d8_100%)] px-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-black/8 bg-white/88 p-10 text-center shadow-[0_24px_80px_rgba(43,35,18,0.08)]">
        <p className="font-mono text-xs tracking-[0.24em] text-stone-500 uppercase">
          Not Found
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          The requested posting was not found.
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          The record may not exist or may not be published yet.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Go to job posting list
        </Link>
      </div>
    </main>
  );
}
