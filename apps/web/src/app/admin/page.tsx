import Link from "next/link";

import { getJobPostings } from "@/shared/api/recruitment";
import { getJobPostingStatusLabel } from "@/shared/lib/recruitment";

export default async function AdminPage() {
  const jobPostings = await getJobPostings();
  const openJobPostingCount = jobPostings.filter(
    (jobPosting) => jobPosting.status === "OPEN",
  ).length;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ambient-shadow rounded-xl bg-surface-container-lowest p-6">
          <p className="text-sm font-semibold text-on-surface-variant">
            전체 공고
          </p>
          <p className="mt-2 font-headline text-4xl font-bold text-primary">
            {jobPostings.length}
          </p>
        </div>
        <div className="ambient-shadow rounded-xl bg-surface-container-lowest p-6">
          <p className="text-sm font-semibold text-on-surface-variant">
            모집 중
          </p>
          <p className="mt-2 font-headline text-4xl font-bold text-secondary">
            {openJobPostingCount}
          </p>
        </div>
        <div className="ambient-shadow rounded-xl bg-surface-container-lowest p-6 sm:col-span-2">
          <p className="text-sm font-semibold text-on-surface-variant">
            빠른 실행
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/applicants"
              className="rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
            >
              지원자 관리
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-highest"
            >
              공개 사이트 보기
            </Link>
          </div>
        </div>
      </div>

      {/* Progress & Snapshot */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <h2 className="font-headline text-2xl font-bold text-on-surface">
            마이그레이션 현황
          </h2>
          <div className="mt-6 space-y-3 text-sm leading-7 text-on-surface-variant">
            <p className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-xs text-secondary">
                &#10003;
              </span>
              기반 구축, 공고 조회, 임시저장
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-xs text-secondary">
                &#10003;
              </span>
              관리자 로그인, 보호된 어드민 영역
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-xs text-secondary">
                &#10003;
              </span>
              최종 제출 흐름 및 지원 상태 규칙
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary-container text-xs text-secondary">
                &#10003;
              </span>
              지원자 관리 및 검토 기능
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-high text-xs text-outline">
                &rarr;
              </span>
              파일 업로드, 정규화된 이력서, 면접 워크플로우
            </p>
          </div>
        </section>

        <section className="ambient-shadow rounded-xl bg-surface-container-lowest p-8">
          <h2 className="font-headline text-2xl font-bold text-on-surface">
            공고 현황
          </h2>
          <div className="mt-6 space-y-4">
            {jobPostings.map((jobPosting) => (
              <div
                key={jobPosting.id}
                className="rounded-lg bg-surface-container-low px-5 py-4"
              >
                <p className="font-headline font-bold text-on-surface">
                  {jobPosting.title}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {getJobPostingStatusLabel(jobPosting.status)} &bull;{" "}
                  {jobPosting.stepCount}단계
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
