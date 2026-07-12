import { ForgotPasswordPanel } from "@/features/recruitment/application/CandidateAccountRecoveryPanels";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <section className="w-full max-w-md rounded-lg border border-outline-variant bg-card p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
          계정 복구
        </p>
        <h1 className="mt-2 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
          비밀번호 찾기
        </h1>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">
          보안을 위해 계정 존재 여부와 관계없이 동일한 안내를 제공합니다.
        </p>
        <div className="mt-7">
          <ForgotPasswordPanel />
        </div>
      </section>
    </main>
  );
}
