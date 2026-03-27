import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import { JobPostingQuestionEditor } from "@/features/admin/questions/JobPostingQuestionEditor";
import { getCurrentAdminSession } from "@/shared/api/admin-auth";
import { ADMIN_SESSION_COOKIE } from "@/shared/lib/admin-auth";

interface QuestionPageProps {
  params: Promise<{ id: string }>;
}

async function getAdminJobPostingQuestions(jobPostingId: number) {
  const baseUrl = (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8081/api"
  ).replace(/\/$/, "");

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken) return [];

  const response = await fetch(`${baseUrl}/job-postings/${jobPostingId}/questions`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Admin-Session": sessionToken,
    },
  });

  if (!response.ok) return [];
  return response.json() as Promise<Array<{
    questionText: string;
    questionType: string;
    choices: string | null;
    required: boolean;
    sortOrder: number;
  }>>;
}

export default async function AdminQuestionPage({ params }: QuestionPageProps) {
  const { id } = await params;
  const jobPostingId = Number(id);

  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0) {
    notFound();
  }

  const adminSession = await getCurrentAdminSession().catch(() => null);
  if (!adminSession) {
    redirect("/admin/login");
  }

  const rawQuestions = await getAdminJobPostingQuestions(jobPostingId);

  const initialQuestions = rawQuestions.map((q, i) => ({
    questionText: q.questionText,
    questionType: q.questionType as "TEXT" | "CHOICE" | "SCALE",
    choices: q.choices
      ? (() => {
          try {
            return JSON.parse(q.choices as string) as string[];
          } catch {
            return [];
          }
        })()
      : [],
    required: q.required,
    sortOrder: q.sortOrder ?? i,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
            공고 #{jobPostingId}
          </p>
          <h1 className="mt-2 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
            지원 문항 관리
          </h1>
        </div>
        <Link
          href="/admin"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant transition-colors hover:text-primary"
        >
          대시보드로
        </Link>
      </div>

      <JobPostingQuestionEditor
        jobPostingId={jobPostingId}
        initialQuestions={initialQuestions}
      />
    </div>
  );
}
