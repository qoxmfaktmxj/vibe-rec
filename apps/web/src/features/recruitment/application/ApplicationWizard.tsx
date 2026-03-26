"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  CandidateApplicationDetail,
  JobPostingQuestion,
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumeSkill,
  ApplicationAnswer,
} from "@/entities/recruitment/model";
import type { CandidateSession } from "@/entities/candidate/model";
import { WizardStepIndicator } from "./WizardStepIndicator";
import { WizardStep1PersonalInfo } from "./WizardStep1PersonalInfo";
import { WizardStep2Introduction } from "./WizardStep2Introduction";
import { WizardStep3Resume } from "./WizardStep3Resume";
import { WizardStep4QuestionsSubmit } from "./WizardStep4QuestionsSubmit";

interface ApplicationWizardProps {
  candidateSession: CandidateSession;
  jobPostingId: number;
  jobPostingTitle: string;
  initialApplication: CandidateApplicationDetail | null;
  customQuestions: JobPostingQuestion[];
}

export function ApplicationWizard({
  candidateSession,
  jobPostingId,
  jobPostingTitle,
  initialApplication,
  customQuestions,
}: ApplicationWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Initialize from existing draft or defaults
  const [currentStep, setCurrentStep] = useState(initialApplication?.currentStep ?? 1);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Step 2 data
  const [step2Data, setStep2Data] = useState<{
    introduction: string;
    coreStrength: string;
    motivationFit: string;
    careerYears: number | null;
  }>({
    introduction: (initialApplication?.resumePayload?.introduction as string) ?? "",
    coreStrength: (initialApplication?.resumePayload?.coreStrength as string) ?? "",
    motivationFit: (initialApplication?.motivationFit as string) ?? "",
    careerYears: (initialApplication?.resumePayload?.careerYears as number | null) ?? null,
  });

  // Step 3 data
  const [step3Data, setStep3Data] = useState({
    educations: initialApplication?.educations ?? ([] as ResumeEducation[]),
    experiences: initialApplication?.experiences ?? ([] as ResumeExperience[]),
    skills: initialApplication?.skills ?? ([] as ResumeSkill[]),
    certifications: initialApplication?.certifications ?? ([] as ResumeCertification[]),
    languages: initialApplication?.languages ?? ([] as ResumeLanguage[]),
  });

  // Step 4 data
  const [step4Data, setStep4Data] = useState({
    trendAnswers: (initialApplication?.resumePayload?.trendAnswers as Record<string, string>) ?? {},
    customAnswers: initialApplication?.answers ?? ([] as ApplicationAnswer[]),
  });

  function buildPayload(targetStep: number) {
    return {
      resumePayload: {
        introduction: step2Data.introduction,
        coreStrength: step2Data.coreStrength,
        careerYears: step2Data.careerYears,
        motivationFit: step2Data.motivationFit,
        currentStep: targetStep,
        trendAnswers: step4Data.trendAnswers,
        answers: step4Data.customAnswers.map((a) => ({
          questionId: a.questionId,
          answerText: a.answerText,
          answerChoice: a.answerChoice,
          answerScale: a.answerScale,
        })),
      },
      educations: step3Data.educations,
      experiences: step3Data.experiences,
      skills: step3Data.skills,
      certifications: step3Data.certifications,
      languages: step3Data.languages,
    };
  }

  async function saveDraft(targetStep: number) {
    setError(null);
    setSaveStatus("저장 중...");
    try {
      const payload = buildPayload(targetStep);
      const response = await fetch(`/api/job-postings/${jobPostingId}/application-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error((errorBody as Record<string, string>).message ?? "저장에 실패했습니다.");
      }
      setSaveStatus("저장 완료");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      setSaveStatus(null);
      return false;
    }
  }

  function validateStep(step: number): string | null {
    if (step === 2) {
      if (step2Data.introduction.length < 20) return "자기소개는 최소 20자 이상 작성해주세요.";
      if (step2Data.coreStrength.length < 10) return "핵심 역량은 최소 10자 이상 작성해주세요.";
    }
    return null;
  }

  function handleNext() {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      const success = await saveDraft(currentStep + 1);
      if (success) {
        setCurrentStep((prev) => Math.min(prev + 1, 4));
      }
    });
  }

  function handlePrev() {
    startTransition(async () => {
      const success = await saveDraft(currentStep - 1);
      if (success) {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
      }
    });
  }

  function handleSaveDraft() {
    startTransition(async () => {
      await saveDraft(currentStep);
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      setError(null);
      setSaveStatus("제출 중...");
      try {
        const payload = buildPayload(4);
        const response = await fetch(`/api/job-postings/${jobPostingId}/application-submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error((errorBody as Record<string, string>).message ?? "제출에 실패했습니다.");
        }
        setSaveStatus("제출 완료!");
        router.push(`/job-postings/${jobPostingId}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "제출에 실패했습니다.");
        setSaveStatus(null);
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
          지원하기
        </p>
        <h1 className="mt-2 font-headline text-2xl font-medium tracking-[-0.04em] text-on-surface">
          {jobPostingTitle}
        </h1>
      </div>

      {/* Step Indicator */}
      <WizardStepIndicator currentStep={currentStep} />

      {/* Step Content */}
      <div className="rounded-sm border border-outline-variant bg-card p-6 sm:p-8">
        <h2 className="mb-6 font-headline text-lg font-medium text-on-surface">
          {currentStep === 1 && "인적사항"}
          {currentStep === 2 && "자기소개 / 핵심역량"}
          {currentStep === 3 && "학력 / 경력 / 스킬"}
          {currentStep === 4 && "추가 질문 및 제출"}
        </h2>

        {currentStep === 1 && (
          <WizardStep1PersonalInfo
            applicantName={candidateSession.name}
            applicantEmail={candidateSession.email}
            applicantPhone={candidateSession.phone}
          />
        )}

        {currentStep === 2 && (
          <WizardStep2Introduction
            data={step2Data}
            onChange={setStep2Data}
            disabled={isPending}
          />
        )}

        {currentStep === 3 && (
          <WizardStep3Resume
            data={step3Data}
            onChange={setStep3Data}
            disabled={isPending}
          />
        )}

        {currentStep === 4 && (
          <WizardStep4QuestionsSubmit
            data={step4Data}
            onChange={setStep4Data}
            customQuestions={customQuestions}
            disabled={isPending}
          />
        )}
      </div>

      {/* Error/Status */}
      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      {saveStatus && !error && (
        <div className="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">{saveStatus}</div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              disabled={isPending}
              onClick={handlePrev}
              className="rounded-sm border border-outline-variant px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-on-surface transition hover:bg-surface-container-low disabled:opacity-50"
            >
              이전
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSaveDraft}
            className="rounded-sm border border-outline-variant px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-on-surface transition hover:bg-surface-container-low disabled:opacity-50"
          >
            임시저장
          </button>
          {currentStep < 4 ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleNext}
              className="rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmit}
              className="rounded-sm bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              최종 제출
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
