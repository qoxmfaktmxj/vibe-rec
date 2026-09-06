import Link from "next/link";

import { AdminLogoutButton } from "@/features/admin/auth/AdminLogoutButton";
import { CandidateLogoutButton } from "@/features/recruitment/application/CandidateLogoutButton";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { getCurrentCandidateSession } from "@/shared/api/candidate-auth";

interface PublicSiteHeaderProps {
  /** Active path for nav highlighting. Accepts any path string — no type update needed when adding routes. */
  activePath?: string;
  tone?: "default" | "signal";
}

const navItems = [
  { href: "/job-postings", label: "채용 공고" },
  { href: "https://www.minseok91.cloud", label: "문의", external: true },
] as const;

export async function PublicSiteHeader({
  activePath = "/",
  tone = "default",
}: PublicSiteHeaderProps) {
  const [candidateSession, adminSession] = await Promise.all([
    getCurrentCandidateSession().catch(() => null),
    getCurrentAdminSession().catch(() => null),
  ]);
  const isSignal = tone === "signal";

  return (
    <nav
      className={`${isSignal ? "signal-nav absolute" : "flat-nav sticky"} top-0 z-50 w-full px-6 py-4 md:px-16`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-6">
          <Link
            href="/"
            className={`group flex min-h-11 items-center gap-3 rounded-md font-headline text-xl font-semibold tracking-[-0.02em] outline-none focus-visible:ring-2 ${
              isSignal ? "text-signal-foreground" : "text-on-surface"
            } ${isSignal ? "focus-visible:ring-signal-foreground" : "focus-visible:ring-ring/40"}`}
          >
            <svg
              aria-hidden="true"
              className="h-8 w-8"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path d="M5 7.5h11.5c5.8 0 10.5 4.7 10.5 10.5S22.3 28.5 16.5 28.5H12" stroke="currentColor" strokeWidth="2" />
              <path d="M5 14h10.5c2.5 0 4.5 2 4.5 4.5S18 23 15.5 23H9" stroke="currentColor" strokeWidth="2" />
              <circle cx="5" cy="7.5" r="2.5" fill="currentColor" />
              <circle cx="5" cy="14" r="2.5" fill="currentColor" />
              <circle cx="9" cy="23" r="2.5" fill="currentColor" />
            </svg>
            HireFlow
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:justify-end md:gap-8">
          <div
            className={`hidden items-center gap-1 rounded-full p-1 md:flex ${
              isSignal ? "signal-nav-links" : "bg-surface-container-low"
            }`}
          >
            {navItems.map((item) => {
              if ("external" in item) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 ${
                      isSignal
                        ? "text-signal-soft hover:text-signal-foreground focus-visible:ring-signal-foreground"
                        : "text-on-surface-variant hover:text-on-surface focus-visible:ring-ring/40"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              }

              const isActive = activePath.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 ${
                    isActive
                      ? isSignal
                        ? "bg-signal-foreground text-signal elevation-1"
                        : "bg-card text-on-surface elevation-1"
                      : isSignal
                        ? "text-signal-soft hover:text-signal-foreground"
                        : "text-on-surface-variant hover:text-on-surface"
                  } ${isSignal ? "focus-visible:ring-signal-foreground" : "focus-visible:ring-ring/40"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 md:hidden">
            {navItems.map((item) =>
              "external" in item ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex min-h-11 items-center rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-2 ${
                    isSignal
                      ? "text-signal-soft hover:text-signal-foreground focus-visible:ring-signal-foreground"
                      : "text-on-surface hover:text-brand focus-visible:ring-ring/40"
                  }`}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={activePath.startsWith(item.href) ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-2 ${
                    isSignal
                      ? "text-signal-soft hover:text-signal-foreground focus-visible:ring-signal-foreground"
                      : "hover:text-brand focus-visible:ring-ring/40"
                  } ${
                    activePath.startsWith(item.href)
                      ? isSignal
                        ? "text-signal-foreground"
                        : "text-brand"
                      : isSignal
                        ? ""
                        : "text-on-surface"
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>

          {candidateSession ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/me"
                className={`inline-flex min-h-11 flex-col justify-center rounded-md text-right outline-none transition-colors focus-visible:ring-2 ${
                  isSignal
                    ? "text-signal-foreground focus-visible:ring-signal-foreground"
                    : "hover:text-brand focus-visible:ring-ring/40"
                }`}
              >
                <p className={`text-xs font-medium ${isSignal ? "text-signal-muted" : "text-on-surface-variant"}`}>
                  지원자
                </p>
                <p className={`text-sm ${isSignal ? "text-signal-foreground" : "text-on-surface"}`}>{candidateSession.name}</p>
              </Link>
              <CandidateLogoutButton redirectTo={activePath} />
            </div>
          ) : adminSession ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className={`text-right ${isSignal ? "text-signal-foreground" : ""}`}>
                <p className={`text-xs font-medium ${isSignal ? "text-signal-muted" : "text-on-surface-variant"}`}>
                  관리자
                </p>
                <p className={`text-sm ${isSignal ? "text-signal-foreground" : "text-on-surface"}`}>{adminSession.displayName}</p>
              </div>
              <Link
                href="/admin"
                className={`inline-flex min-h-11 items-center rounded-full px-5 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 ${
                  isSignal
                    ? "bg-signal-accent text-signal-ink hover:bg-signal-accent-strong focus-visible:ring-signal-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring/40"
                }`}
              >
                대시보드
              </Link>
              <AdminLogoutButton redirectTo={activePath} />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/auth/login"
                className={`inline-flex min-h-11 items-center rounded-full px-5 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 ${
                  isSignal
                    ? "bg-signal-accent text-signal-ink hover:bg-signal-accent-strong focus-visible:ring-signal-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring/40"
                }`}
              >
                로그인
              </Link>
              <Link
                href="/auth/login?mode=signup"
                className={`inline-flex min-h-11 items-center rounded-full border px-5 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 ${
                  isSignal
                    ? "border-signal-border text-signal-foreground hover:border-signal-foreground focus-visible:ring-signal-foreground"
                    : "border-outline-variant text-on-surface hover:border-brand hover:text-brand focus-visible:ring-ring/40"
                }`}
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
