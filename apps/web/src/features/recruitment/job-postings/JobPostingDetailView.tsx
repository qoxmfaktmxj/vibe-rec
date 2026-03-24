import type { ReactNode } from "react";

import type { JobPostingDetail } from "@/entities/recruitment/model";
import {
  formatDateRange,
  getStepTypeLabel,
} from "@/shared/lib/recruitment";

interface JobPostingDetailViewProps {
  jobPosting: JobPostingDetail;
  applicationSlot: ReactNode;
}

const postingTranslations: Record<
  string,
  {
    title: string;
    headline: string;
    description: string;
    employmentType: string;
    location: string;
  }
> = {
  "platform-backend-engineer": {
    title: "플랫폼 백엔드 엔지니어",
    headline: "PostgreSQL 중심 아키텍처로 차세대 채용 플랫폼을 구축합니다.",
    description:
      "채용 공고, 지원서, 평가, 오퍼 흐름을 현대화하면서도 기존 운영과의 정합성을 유지하는 역할입니다.",
    employmentType: "정규직",
    location: "서울",
  },
  "product-designer": {
    title: "프로덕트 디자이너",
    headline: "지원자와 채용 담당자를 위한 경험을 설계합니다.",
    description:
      "지원자 여정과 채용 운영 화면 전반을 함께 설계하고, 리서치와 UI 품질을 연결하는 역할입니다.",
    employmentType: "계약직",
    location: "서울",
  },
};

const stepTitleTranslations: Record<string, string> = {
  "Document Review": "서류 검토",
  "Technical Interview": "기술 면접",
  "Leadership Interview": "리더십 면접",
  "Offer Discussion": "오퍼 협의",
};

const stepDescriptionTranslations: Record<string, string> = {
  "Review resumes and core fit for the role.": "이력서와 직무 적합도를 검토합니다.",
  "Assess backend design, delivery ownership, and collaboration.": "백엔드 설계 역량, 전달 책임감, 협업 방식을 확인합니다.",
  "Validate cross-functional communication and operating style.": "협업 커뮤니케이션과 업무 운영 방식을 점검합니다.",
  "Align compensation, onboarding, and start date.": "보상, 온보딩, 입사 일정을 조율합니다.",
};

export function JobPostingDetailView({
  jobPosting,
  applicationSlot,
}: JobPostingDetailViewProps) {
  const translated = postingTranslations[jobPosting.publicKey];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_420px]">
      <div className="space-y-8">
        <section className="rounded-sm border border-outline-variant bg-card p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                {jobPosting.publicKey}
              </p>
              <h1 className="mt-3 font-headline text-4xl font-medium tracking-[-0.05em] text-on-surface">
                {translated?.title ?? jobPosting.title}
              </h1>
            </div>
            <div className="space-y-1 text-right font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              <p>{translated?.employmentType ?? jobPosting.employmentType}</p>
              <p>{translated?.location ?? jobPosting.location}</p>
              <p>{formatDateRange(jobPosting.opensAt, jobPosting.closesAt)}</p>
            </div>
          </div>
          <p className="mt-6 text-base leading-8 text-on-surface-variant">
            {translated?.headline ?? jobPosting.headline}
          </p>
          <p className="mt-6 whitespace-pre-line text-sm leading-8 text-on-surface-variant">
            {translated?.description ?? jobPosting.description}
          </p>
        </section>

        <section className="rounded-sm border border-outline-variant bg-card p-8">
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant pb-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                전형
              </p>
              <h2 className="mt-3 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
                채용 단계
              </h2>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
              총 {jobPosting.steps.length}단계
            </span>
          </div>
          <ol className="mt-6 space-y-4">
            {jobPosting.steps.map((step) => (
              <li
                key={`${jobPosting.id}-${step.stepOrder}`}
                className="rounded-sm border border-outline-variant bg-surface-container-low px-5 py-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">
                      {step.stepOrder}단계 · {getStepTypeLabel(step.stepType)}
                    </p>
                    <h3 className="font-headline text-lg font-medium tracking-[-0.03em] text-on-surface">
                      {stepTitleTranslations[step.title] ?? step.title}
                    </h3>
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                    {formatDateRange(step.startsAt, step.endsAt)}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                  {stepDescriptionTranslations[step.description] ??
                    step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">{applicationSlot}</aside>
    </div>
  );
}
