import Link from "next/link";

import { LegalLayerLinks } from "@/features/recruitment/legal/LegalLayerLinks";

const hiringLinks = [
  { href: "/job-postings", label: "채용 공고 보기" },
  { href: "https://www.minseok91.cloud", label: "문의", external: true },
] as const;

const candidateLinks = [
  { href: "/auth/login", label: "로그인" },
  { href: "/auth/login?mode=signup", label: "회원가입" },
  { href: "/me", label: "내 지원 현황" },
] as const;

export function PublicSiteFooter() {
  return (
    <footer className="bg-surface-dark text-on-dark-soft">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-16 md:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="space-y-3">
            <p className="font-headline text-xl font-semibold tracking-[-0.02em] text-on-dark">
              HireFlow
            </p>
            <p className="max-w-[26ch] text-sm leading-7 text-on-dark-soft">
              지원부터 결과 발표까지, 지금 어디까지 왔는지 보이는 채용 운영 플랫폼입니다.
            </p>
          </div>

          <nav aria-label="채용 안내">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-dark-soft">
              채용 안내
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {hiringLinks.map((link) =>
                "external" in link && link.external ? (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-on-dark"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-on-dark">
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <nav aria-label="지원자">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-dark-soft">
              지원자
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {candidateLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-on-dark">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="법적 고지">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-dark-soft">
              법적 고지
            </p>
            <div className="mt-4 flex flex-col items-start gap-3 text-sm">
              <LegalLayerLinks linkClassName="text-on-dark-soft transition-colors hover:text-on-dark" />
            </div>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-[11px] text-on-dark-soft md:flex-row md:items-center md:justify-between">
          <p>© 2026 HireFlow. 모든 권리 보유.</p>
          <a
            href="https://www.minseok91.cloud"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-on-dark"
          >
            운영 문의
          </a>
        </div>
      </div>
    </footer>
  );
}
