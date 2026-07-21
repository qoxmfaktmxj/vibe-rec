import Link from "next/link";
import { redirect } from "next/navigation";

import { CandidateAuthForm } from "@/features/recruitment/application/CandidateAuthForm";
import { PublicSiteFooter } from "@/features/recruitment/layout/PublicSiteFooter";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { getCurrentCandidateSession } from "@/shared/api/candidate-auth";
import { resolveInternalPath } from "@/shared/lib/internal-path";

interface CandidateLoginPageProps {
  searchParams: Promise<{
    mode?: string;
    next?: string;
  }>;
}

export default async function CandidateLoginPage({
  searchParams,
}: CandidateLoginPageProps) {
  const [candidateSession, adminSession, params] = await Promise.all([
    getCurrentCandidateSession().catch(() => null),
    getCurrentAdminSession().catch(() => null),
    searchParams,
  ]);
  const defaultMode = params.mode === "signup" ? "signup" : "login";
  const nextPath = resolveInternalPath(params.next, "/job-postings");

  if (candidateSession) {
    redirect(nextPath);
  }

  if (adminSession) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-xl border border-outline-variant bg-card px-10 py-12 elevation-2">
          <div className="space-y-4 border-b border-outline-variant pb-8">
            <p className="font-headline text-2xl font-semibold tracking-[-0.02em] text-on-surface">
              HireFlow
            </p>
            <div className="space-y-2">
              <h1 className="font-headline text-3xl font-bold tracking-[-0.02em] text-on-surface">
                지원자 회원가입
              </h1>
              <p className="text-sm leading-7 text-on-surface-variant">
                회원가입 또는 로그인 후 지원서를 작성하고 제출할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="pt-8">
            <CandidateAuthForm defaultMode={defaultMode} nextPath={nextPath} />
          </div>

          <div className="mt-8 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
            <Link href="/" className="transition-colors hover:text-brand">
              홈으로 이동
            </Link>
            <Link href="/admin/login" className="transition-colors hover:text-brand">
              관리자 로그인
            </Link>
          </div>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
