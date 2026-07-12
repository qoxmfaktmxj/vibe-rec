import { redirect } from "next/navigation";

import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { getCurrentCandidateSession } from "@/shared/api/candidate-auth";
import { resolveInternalPath } from "@/shared/lib/internal-path";

interface LoginRedirectPageProps {
  searchParams: Promise<{
    mode?: string;
    next?: string;
  }>;
}

export default async function LoginRedirectPage({
  searchParams,
}: LoginRedirectPageProps) {
  const [candidateSession, adminSession, params] = await Promise.all([
    getCurrentCandidateSession().catch(() => null),
    getCurrentAdminSession().catch(() => null),
    searchParams,
  ]);
  const nextPath = resolveInternalPath(params.next, "/job-postings");

  if (adminSession) {
    redirect("/admin");
  }

  if (candidateSession) {
    redirect(nextPath);
  }

  const nextSearchParams = new URLSearchParams();
  if (params.mode) {
    nextSearchParams.set("mode", params.mode);
  }
  if (params.next) {
    nextSearchParams.set("next", params.next);
  }

  redirect(
    nextSearchParams.size > 0
      ? `/auth/login?${nextSearchParams.toString()}`
      : "/auth/login",
  );
}
