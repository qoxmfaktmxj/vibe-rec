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
    <footer className="footer-signal text-on-dark-soft">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-16 md:py-24">
        <div className="border-b border-[color:var(--dark-hairline)] pb-12 md:pb-16">
          <p className="font-headline text-[clamp(4rem,12vw,9rem)] font-semibold leading-none tracking-[-0.045em] text-on-dark">
            HireFlow
          </p>
          <div className="mt-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <p className="max-w-xl text-base leading-8 text-on-dark-soft">
              공고를 찾는 순간부터 결과를 확인하는 순간까지, 지원의 흐름이 끊기지 않도록.
            </p>
            <Link
              href="/job-postings"
              className="group inline-flex min-h-11 items-center gap-3 self-start rounded-full bg-signal-accent px-5 py-2.5 text-sm font-bold text-signal-ink outline-none transition-colors hover:bg-signal-accent-strong focus-visible:ring-2 focus-visible:ring-signal-foreground md:self-auto"
            >
              열린 포지션 보기
              <span aria-hidden="true" className="motion-arrow transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal-accent">
              지원의 현재 위치
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
                      className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-accent"
                    >
                      {link.label}
                      <span className="sr-only">, 새 창에서 열림</span>
                    </a>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-accent">
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
                  <Link href={link.href} className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-accent">
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
              <LegalLayerLinks linkClassName="inline-flex min-h-11 min-w-11 items-center text-on-dark-soft outline-none transition-colors hover:text-on-dark focus-visible:ring-2 focus-visible:ring-signal-accent" />
            </div>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[color:var(--dark-hairline)] pt-6 font-mono text-[11px] text-on-dark-soft md:flex-row md:items-center md:justify-between">
          <p>© 2026 HireFlow. 모든 권리 보유.</p>
          <a
            href="https://www.minseok91.cloud"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 min-w-11 items-center transition-colors hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-accent"
          >
            운영 문의
            <span className="sr-only">, 새 창에서 열림</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
