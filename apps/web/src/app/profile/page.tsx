import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileDashboard } from "@/features/candidate/profile/ProfileDashboard";
import {
  getCurrentCandidateSession,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import { getCandidateApplications } from "@/shared/api/recruitment";

export default async function ProfilePage() {
  const candidateSession = await getCurrentCandidateSession().catch(() => null);
  if (!candidateSession) {
    redirect("/auth/login?next=/profile");
  }

  const sessionToken = await getRequiredCandidateSessionToken();
  const applications = await getCandidateApplications(sessionToken).catch(() => []);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="sticky top-0 z-50 border-b border-outline-variant bg-background/95 px-6 py-4 backdrop-blur md:px-16">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <Link
            href="/"
            className="font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface"
          >
            HireFlow
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/job-postings"
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant transition-colors hover:text-primary"
            >
              공고 보기
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-10 md:px-16">
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
            My profile
          </p>
          <h1 className="mt-2 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
            내 프로필
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            프로필을 미리 작성해두면 공고 지원 시 빠르게 불러올 수 있습니다.
          </p>
        </div>

        <ProfileDashboard
          candidateSession={candidateSession}
          applications={applications}
        />
      </main>
    </div>
  );
}
