import Link from "next/link";
import { redirect } from "next/navigation";

import { CandidateAuthForm } from "@/features/recruitment/application/CandidateAuthForm";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { getCurrentCandidateSession } from "@/shared/api/candidate-auth";

interface CandidateLoginPageProps {
  searchParams: Promise<{
    mode?: string;
    next?: string;
  }>;
}

function resolveNextPath(rawNext?: string) {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/job-postings";
  }

  return rawNext;
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
  const nextPath = resolveNextPath(params.next);

  if (candidateSession) {
    redirect(nextPath);
  }

  if (adminSession) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-sm border border-outline-variant bg-surface px-10 py-12">
        <div className="space-y-4 border-b border-outline-variant pb-8">
          <p className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            HireFlow
          </p>
          <div className="space-y-2">
            <h1 className="font-headline text-3xl font-light tracking-[-0.05em] text-on-surface">
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
          <Link href="/" className="transition-colors hover:text-primary">
            홈으로
          </Link>
          <Link href="/admin/login" className="transition-colors hover:text-primary">
            관리자 로그인
          </Link>
        </div>
      </div>
    </main>
  );
}
