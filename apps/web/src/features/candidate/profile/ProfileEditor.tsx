"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type {
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumeSkill,
} from "@/entities/recruitment/model";
import {
  EducationSection,
  ExperienceSection,
  SkillSection,
  CertificationSection,
  LanguageSection,
} from "@/features/recruitment/application/ResumeSections";

const inputClassName =
  "w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

export function ProfileEditor() {
  const [isPending, startTransition] = useTransition();
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "failed" | "conflict">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const [introductionTemplate, setIntroductionTemplate] = useState("");
  const [coreStrengthTemplate, setCoreStrengthTemplate] = useState("");
  const [careerYears, setCareerYears] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [educations, setEducations] = useState<ResumeEducation[]>([]);
  const [experiences, setExperiences] = useState<ResumeExperience[]>([]);
  const [skills, setSkills] = useState<ResumeSkill[]>([]);
  const [certifications, setCertifications] = useState<ResumeCertification[]>(
    [],
  );
  const [languages, setLanguages] = useState<ResumeLanguage[]>([]);

  const loadProfile = useCallback(async () => {
    setLoadState("loading");
    setError(null);

    try {
      const response = await fetch("/api/candidate/profile");
      if (!response.ok) {
        throw new Error("프로필을 불러오지 못했습니다.");
      }

      const data = (await response.json()) as {
        revision?: number;
        introductionTemplate?: string | null;
        coreStrengthTemplate?: string | null;
        careerYears?: number | null;
        educations?: ResumeEducation[];
        experiences?: ResumeExperience[];
        skills?: ResumeSkill[];
        certifications?: ResumeCertification[];
        languages?: ResumeLanguage[];
      };
      setRevision(data.revision ?? 0);
      setIntroductionTemplate(data.introductionTemplate ?? "");
      setCoreStrengthTemplate(data.coreStrengthTemplate ?? "");
      setCareerYears(data.careerYears ?? null);
      setEducations(data.educations ?? []);
      setExperiences(data.experiences ?? []);
      setSkills(data.skills ?? []);
      setCertifications(data.certifications ?? []);
      setLanguages(data.languages ?? []);
      setLoadState("loaded");
    } catch {
      setLoadState("failed");
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function handleSave() {
    if (loadState !== "loaded") {
      return;
    }

    startTransition(async () => {
      setError(null);
      setSaveStatus("저장 중...");
      try {
        const response = await fetch("/api/candidate/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            revision,
            introductionTemplate,
            coreStrengthTemplate,
            careerYears,
            educations,
            experiences,
            skills,
            certifications,
            languages,
          }),
        });
        if (!response.ok) {
          const errorBody = (await response.json().catch(() => ({}))) as {
            message?: string;
          };
          if (response.status === 409) {
            setLoadState("conflict");
          }
          throw new Error(errorBody.message ?? "저장에 실패했습니다.");
        }
        const savedProfile = (await response.json()) as { revision?: number };
        setRevision(savedProfile.revision ?? revision + 1);
        setSaveStatus("저장 완료!");
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
        setSaveStatus(null);
      }
    });
  }

  if (loadState === "loading") {
    return <div className="py-8 text-center text-sm text-on-surface-variant">프로필 불러오는 중...</div>;
  }

  if (loadState === "failed" || loadState === "conflict") {
    const isConflict = loadState === "conflict";
    return (
      <div className="space-y-4 rounded-lg bg-error-container p-6 text-sm text-destructive" role="alert">
        <p>
          {isConflict
            ? error ?? "다른 화면에서 프로필이 변경되었습니다. 최신 내용을 다시 불러와 주세요."
            : "프로필을 불러오지 못해 편집을 중단했습니다. 기존 데이터 보호를 위해 다시 불러온 뒤 저장해 주세요."}
        </p>
        <button
          type="button"
          onClick={() => void loadProfile()}
          className="rounded-sm bg-primary px-5 py-3 text-xs font-medium text-primary-foreground"
        >
          다시 불러오기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-on-surface-variant">
        아래 내용을 미리 작성해 두면 공고 지원 시 “프로필에서 가져오기” 버튼으로 빠르게 불러올 수 있습니다.
      </p>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-on-surface-variant">자기소개 템플릿</h3>
        <textarea
          rows={5}
          disabled={isPending}
          className={`resize-y ${inputClassName}`}
          placeholder="자주 사용하는 자기소개를 미리 작성해 두세요."
          value={introductionTemplate}
          onChange={(e) => setIntroductionTemplate(e.target.value)}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-on-surface-variant">핵심 강점 템플릿</h3>
        <textarea
          rows={4}
          disabled={isPending}
          className={`resize-y ${inputClassName}`}
          placeholder="자주 사용하는 핵심 강점 설명을 미리 작성해 두세요."
          value={coreStrengthTemplate}
          onChange={(e) => setCoreStrengthTemplate(e.target.value)}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-on-surface-variant">경력 연수</h3>
        <input
          type="number"
          min={0}
          max={50}
          disabled={isPending}
          className={`w-32 ${inputClassName}`}
          placeholder="연수"
          value={careerYears ?? ""}
          onChange={(e) => setCareerYears(e.target.value ? Number(e.target.value) : null)}
        />
      </section>

      <EducationSection items={educations} onChange={setEducations} disabled={isPending} />
      <ExperienceSection items={experiences} onChange={setExperiences} disabled={isPending} />
      <SkillSection items={skills} onChange={setSkills} disabled={isPending} />
      <CertificationSection items={certifications} onChange={setCertifications} disabled={isPending} />
      <LanguageSection items={languages} onChange={setLanguages} disabled={isPending} />

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      {saveStatus && !error && (
        <div className="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">{saveStatus}</div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="rounded-sm bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          프로필 저장
        </button>
      </div>
    </div>
  );
}
