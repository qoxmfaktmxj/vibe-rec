"use client";

import { useEffect, useState } from "react";

/**
 * Renders a full-screen overlay on viewports narrower than 1024px,
 * guarding the admin workspace (desktop-only by design).
 */
export function AdminMobileGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    function check() {
      setIsMobile(window.innerWidth < 1024);
    }

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // During SSR / before hydration, render children normally to avoid flash
  if (!mounted) return <>{children}</>;

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-8 text-center text-on-surface">
        <div className="rounded-sm border border-outline-variant bg-card px-8 py-10 max-w-sm">
          {/* Monitor icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="mx-auto mb-5 h-12 w-12 text-on-surface-variant"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"
            />
          </svg>

          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
            어드민 워크스페이스
          </p>
          <h1 className="mt-3 font-headline text-xl font-medium tracking-[-0.04em] text-on-surface">
            데스크탑에서 이용해 주세요
          </h1>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            HireFlow 어드민은 데스크탑 환경에 최적화되어 있습니다.
            <br />
            1024px 이상의 화면에서 접속해 주세요.
          </p>

          <a
            href="/"
            className="mt-6 inline-flex rounded-sm border border-outline-variant px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary hover:text-primary"
          >
            공개 사이트로 이동
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
