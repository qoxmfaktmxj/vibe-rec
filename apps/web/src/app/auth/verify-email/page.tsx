import { redirect } from "next/navigation";

import { EmailVerificationPanel } from "@/features/recruitment/application/CandidateAccountRecoveryPanels";
import { getCurrentCandidateSession } from "@/shared/api/candidate-auth";
import { resolveInternalPath } from "@/shared/lib/internal-path";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const [params, session] = await Promise.all([
    searchParams,
    getCurrentCandidateSession().catch(() => null),
  ]);
  const nextPath = resolveInternalPath(params.next, "/job-postings");
  if (session?.emailVerified) redirect(nextPath);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <section className="w-full max-w-md rounded-lg border border-outline-variant bg-card p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
          계정 보안
        </p>
        <h1 className="mt-2 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
          이메일 확인
        </h1>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">
          이메일 소유권을 확인하면 지원서를 최종 제출할 수 있습니다.
        </p>
        <div className="mt-7">
          <EmailVerificationPanel token={params.token} nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}
