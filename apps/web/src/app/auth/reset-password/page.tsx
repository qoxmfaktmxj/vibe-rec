import { ResetPasswordPanel } from "@/features/recruitment/application/CandidateAccountRecoveryPanels";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <section className="w-full max-w-md rounded-lg border border-outline-variant bg-card p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
          계정 복구
        </p>
        <h1 className="mt-2 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
          새 비밀번호 설정
        </h1>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">
          완료하면 기존 로그인 세션은 모두 종료되고 이 기기에서 새 세션이 시작됩니다.
        </p>
        <div className="mt-7">
          <ResetPasswordPanel token={token} />
        </div>
      </section>
    </main>
  );
}
