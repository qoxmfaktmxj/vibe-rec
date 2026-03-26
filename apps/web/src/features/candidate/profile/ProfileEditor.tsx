"use client";

import { useState, useEffect, useTransition } from "react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Profile data
  const [introductionTemplate, setIntroductionTemplate] = useState("");
  const [coreStrengthTemplate, setCoreStrengthTemplate] = useState("");
  const [careerYears, setCareerYears] = useState<number | null>(null);
  const [educations, setEducations] = useState<ResumeEducation[]>([]);
  const [experiences, setExperiences] = useState<ResumeExperience[]>([]);
  const [skills, setSkills] = useState<ResumeSkill[]>([]);
  const [certifications, setCertifications] = useState<ResumeCertification[]>([]);
  const [languages, setLanguages] = useState<ResumeLanguage[]>([]);

  useEffect(() => {
    fetch("/api/candidate/profile")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json() as {
            introductionTemplate?: string | null;
            coreStrengthTemplate?: string | null;
            careerYears?: number | null;
            educations?: ResumeEducation[];
            experiences?: ResumeExperience[];
            skills?: ResumeSkill[];
            certifications?: ResumeCertification[];
            languages?: ResumeLanguage[];
          };
          setIntroductionTemplate(data.introductionTemplate ?? "");
          setCoreStrengthTemplate(data.coreStrengthTemplate ?? "");
          setCareerYears(data.careerYears ?? null);
          setEducations(data.educations ?? []);
          setExperiences(data.experiences ?? []);
          setSkills(data.skills ?? []);
          setCertifications(data.certifications ?? []);
          setLanguages(data.languages ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSave() {
    startTransition(async () => {
      setError(null);
      setSaveStatus("저장 중...");
      try {
        const response = await fetch("/api/candidate/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
        if (!response.ok) throw new Error("저장에 실패했습니다.");
        setSaveStatus("저장 완료!");
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
        setSaveStatus(null);
      }
    });
  }

  if (loading) {
    return <div className="py-8 text-center text-sm text-on-surface-variant">프로필 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-on-surface-variant">
        아래 내용을 미리 작성해두면 공고 지원 시 &quot;프로필에서 가져오기&quot; 버튼으로 빠르게 불러올 수 있습니다.
      </p>

      {/* Text templates */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-on-surface-variant">자기소개 템플릿</h3>
        <textarea
          rows={5}
          disabled={isPending}
          className={`resize-y ${inputClassName}`}
          placeholder="자주 사용하는 자기소개를 미리 작성해두세요."
          value={introductionTemplate}
          onChange={(e) => setIntroductionTemplate(e.target.value)}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-on-surface-variant">핵심역량 템플릿</h3>
        <textarea
          rows={4}
          disabled={isPending}
          className={`resize-y ${inputClassName}`}
          placeholder="자주 사용하는 핵심역량 설명을 미리 작성해두세요."
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

      {/* Resume sections - reusing existing components */}
      <EducationSection items={educations} onChange={setEducations} disabled={isPending} />
      <ExperienceSection items={experiences} onChange={setExperiences} disabled={isPending} />
      <SkillSection items={skills} onChange={setSkills} disabled={isPending} />
      <CertificationSection items={certifications} onChange={setCertifications} disabled={isPending} />
      <LanguageSection items={languages} onChange={setLanguages} disabled={isPending} />

      {/* Error / Status */}
      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      {saveStatus && !error && (
        <div className="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">{saveStatus}</div>
      )}

      {/* Save button */}
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
