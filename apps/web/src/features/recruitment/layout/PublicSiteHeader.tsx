import Link from "next/link";

import { AdminLogoutButton } from "@/features/admin/auth/AdminLogoutButton";
import { CandidateLogoutButton } from "@/features/recruitment/application/CandidateLogoutButton";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { getCurrentCandidateSession } from "@/shared/api/candidate-auth";

interface PublicSiteHeaderProps {
  /** Active path for nav highlighting. Accepts any path string — no type update needed when adding routes. */
  activePath?: string;
}

const navItems = [
  { href: "/job-postings", label: "채용 공고" },
  { href: "https://www.minseok91.cloud", label: "문의", external: true },
] as const;

export async function PublicSiteHeader({
  activePath = "/",
}: PublicSiteHeaderProps) {
  const [candidateSession, adminSession] = await Promise.all([
    getCurrentCandidateSession().catch(() => null),
    getCurrentAdminSession().catch(() => null),
  ]);

  return (
    <nav className="flat-nav sticky top-0 z-50 px-6 py-4 md:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-6">
          <Link
            href="/"
            className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface"
          >
            HireFlow
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:justify-end md:gap-8">
          {navItems.map((item) =>
            "external" in item ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-on-surface transition-colors hover:text-primary"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  activePath.startsWith(item.href) ? "text-primary" : "text-on-surface"
                }`}
              >
                {item.label}
              </Link>
            ),
          )}

          {candidateSession ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/me"
                className="text-right transition-colors hover:text-primary"
              >
                <p className="text-xs font-medium text-on-surface-variant">
                  지원자
                </p>
                <p className="text-sm text-on-surface">{candidateSession.name}</p>
              </Link>
              <CandidateLogoutButton redirectTo={activePath} />
            </div>
          ) : adminSession ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium text-on-surface-variant">
                  관리자
                </p>
                <p className="text-sm text-on-surface">{adminSession.displayName}</p>
              </div>
              <Link
                href="/admin"
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                대시보드
              </Link>
              <AdminLogoutButton redirectTo={activePath} />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/auth/login"
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                로그인
              </Link>
              <Link
                href="/auth/login?mode=signup"
                className="rounded-lg border border-outline-variant px-5 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
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
