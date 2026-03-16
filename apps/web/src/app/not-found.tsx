import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="ambient-shadow w-full max-w-xl rounded-xl bg-surface-container-lowest p-10 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-high">
          <svg
            className="h-7 w-7 text-outline"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-4 text-sm leading-7 text-on-surface-variant">
          존재하지 않거나 아직 게시되지 않은 페이지입니다.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-gradient-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-primary/20 active:translate-y-0"
        >
          채용 공고로 이동
        </Link>
      </div>
    </main>
  );
}
