import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminAuthForm } from "@/features/admin/auth/AdminAuthForm";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";

interface AdminLoginPageProps {
  searchParams: Promise<{
    mode?: string;
  }>;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const session = await getCurrentAdminSession();
  const { mode } = await searchParams;

  if (session) {
    redirect("/admin");
  }

  const defaultMode = mode === "signup" ? "signup" : "login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-sm border border-outline-variant bg-surface px-10 py-12">
        <div className="space-y-4 border-b border-outline-variant pb-8">
          <p className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            HireFlow
          </p>
          <div className="space-y-2">
            <h1 className="font-headline text-3xl font-light tracking-[-0.05em] text-on-surface">
              愿由ъ옄 ?묒냽
            </h1>
            <p className="text-sm leading-7 text-on-surface-variant">
              梨꾩슜 ?댁쁺 ?뚰겕?ㅽ럹?댁뒪??濡쒓렇?명븯嫄곕굹 愿由ъ옄 怨꾩젙???앹꽦?섏꽭??
            </p>
          </div>
        </div>

        <div className="pt-8">
          <AdminAuthForm defaultMode={defaultMode} />
        </div>

        <div className="mt-8 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
          <Link href="/" className="transition-colors hover:text-primary">
            ?덉쑝濡??대룞
          </Link>
          <Link href="/auth/login" className="transition-colors hover:text-primary">
            吏?먯옄 濡쒓렇??
          </Link>
        </div>
      </div>
    </main>
  );
}

