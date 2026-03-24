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
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-sm border border-outline-variant bg-surface px-10 py-12">
        <div className="space-y-4 border-b border-outline-variant pb-8">
          <p className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            Vibe Rec
          </p>
          <div className="space-y-2">
            <h1 className="font-headline text-3xl font-light tracking-[-0.05em] text-on-surface">
              Sign in to continue.
            </h1>
            <p className="text-sm leading-7 text-on-surface-variant">
              Access the recruiting workspace, review applicants, and manage
              workflow decisions.
            </p>
          </div>
        </div>

        <div className="pt-8">
          <AdminLoginForm />
        </div>

        <div className="mt-8 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
          <Link href="/" className="transition-colors hover:text-primary">
            Back to Home
          </Link>
          <span>Secure access</span>
        </div>
      </div>
    </main>
  );
}
