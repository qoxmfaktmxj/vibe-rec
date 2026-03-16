import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/features/admin/auth/AdminLoginForm";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";

export default async function LoginPage() {
  const session = await getCurrentAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen">
      {/* Left Side: Login Form */}
      <section className="relative z-10 flex w-full flex-col justify-center bg-surface px-8 sm:px-16 lg:w-1/2 lg:px-24">
        <div className="mb-12">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
              Vibe Rec
            </span>
          </div>
          <h1 className="mb-4 font-headline text-4xl font-extrabold leading-tight text-on-surface lg:text-5xl">
            당신의 미래가
            <br />
            여기 <span className="text-primary">있습니다</span>.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-on-surface-variant">
            운영자 대시보드에 로그인하여 채용 현황을 관리하세요.
          </p>
        </div>

        <div className="w-full max-w-md">
          <AdminLoginForm />

          <div className="mt-8 border-t border-outline-variant/20 pt-8">
            <p className="text-center text-on-surface-variant">
              채용 공고 보기?{" "}
              <Link
                href="/"
                className="ml-1 font-bold text-primary hover:underline"
              >
                공고 확인하기
              </Link>
            </p>
          </div>
        </div>

        <footer className="mt-auto py-8">
          <p className="text-xs text-outline">
            &copy; 2024 Vibe Rec. All rights reserved.
          </p>
        </footer>
      </section>

      {/* Right Side: Visual Brand Experience */}
      <section className="relative hidden overflow-hidden bg-surface-container-low lg:flex lg:w-1/2">
        {/* Decorative Elements */}
        <div className="absolute right-20 top-20 h-64 w-64 rounded-full bg-secondary-container opacity-30 blur-3xl" />
        <div className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-primary-container opacity-20 blur-3xl" />

        <div className="relative z-10 flex w-full flex-col items-center justify-center p-12 text-center">
          <div className="max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary-fixed px-4 py-2">
              <svg
                className="h-4 w-4 text-[#005313]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest text-[#005313]">
                검증된 플랫폼
              </span>
            </div>

            <h2 className="font-headline text-3xl font-extrabold leading-tight text-on-surface">
              채용이 번거로울 필요 없습니다.
            </h2>

            <p className="leading-relaxed text-on-surface-variant">
              공고 등록부터 온보딩까지, 채용 프로세스를 간소화하는 현대적인
              도구.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex -space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-primary-fixed font-headline text-xs font-bold text-primary">
                  HR
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-secondary-container font-headline text-xs font-bold text-secondary">
                  TA
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-surface-container-high font-headline text-xs font-bold text-on-surface-variant">
                  PM
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-on-surface">
                  채용 담당자를 위해
                </p>
                <p className="text-xs text-on-surface-variant">
                  간소화된 워크플로우
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating glass panels */}
        <div className="absolute right-[-3rem] top-1/4 z-30 flex h-12 w-48 items-center gap-3 rounded-full px-4 shadow-lg glass-panel">
          <svg
            className="h-5 w-5 text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <span className="text-xs font-bold text-on-surface">
            채용률 +24%
          </span>
        </div>
      </section>
    </main>
  );
}
