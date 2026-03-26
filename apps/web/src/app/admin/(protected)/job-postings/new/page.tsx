import Link from "next/link";
import { redirect } from "next/navigation";

import { JobPostingEditorForm } from "@/features/admin/job-postings/JobPostingEditorForm";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";

const emptyJobPosting = {
  legacyAnnoId: null,
  publicKey: "",
  title: "",
  headline: "",
  description: "",
  employmentType: "FULL_TIME",
  recruitmentCategory: "EXPERIENCED" as const,
  recruitmentMode: "FIXED_TERM" as const,
  location: "Seoul",
  status: "DRAFT" as const,
  published: true,
  opensAt: new Date().toISOString(),
  closesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
};

export default async function AdminNewJobPostingPage() {
  const adminSession = await getCurrentAdminSession().catch(() => null);
  if (!adminSession) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
            New job posting
          </p>
          <h1 className="mt-2 font-headline text-3xl font-medium tracking-[-0.04em] text-on-surface">
            공고 등록
          </h1>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            신입, 경력, 상시 채용 분류와 모집 일정을 설정합니다.
          </p>
        </div>

        <Link
          href="/admin"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant transition-colors hover:text-primary"
        >
          대시보드로
        </Link>
      </div>

      <JobPostingEditorForm mode="create" initialValue={emptyJobPosting} />
    </div>
  );
}
