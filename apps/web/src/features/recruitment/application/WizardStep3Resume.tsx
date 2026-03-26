"use client";

import { useState } from "react";
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
} from "./ResumeSections";

interface Step3Data {
  educations: ResumeEducation[];
  experiences: ResumeExperience[];
  skills: ResumeSkill[];
  certifications: ResumeCertification[];
  languages: ResumeLanguage[];
}

interface WizardStep3Props {
  data: Step3Data;
  onChange: (data: Step3Data) => void;
  disabled: boolean;
  sessionToken: string;
}

export function WizardStep3Resume({ data, onChange, disabled, sessionToken: _sessionToken }: WizardStep3Props) {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleImportFromProfile() {
    setImporting(true);
    setImportError(null);
    try {
      const response = await fetch("/api/candidate/profile");
      if (!response.ok) {
        setImportError("프로필을 불러올 수 없습니다. 먼저 프로필을 작성해주세요.");
        return;
      }
      const profile = await response.json();

      const newData: Step3Data = {
        educations: (profile.educations ?? []).map((e: Record<string, unknown>, i: number) => ({
          institution: e.institution ?? "",
          degree: e.degree ?? "",
          fieldOfStudy: e.fieldOfStudy ?? "",
          startDate: e.startDate ?? null,
          endDate: e.endDate ?? null,
          description: e.description ?? "",
          sortOrder: i,
        })),
        experiences: (profile.experiences ?? []).map((e: Record<string, unknown>, i: number) => ({
          company: e.company ?? "",
          position: e.position ?? "",
          startDate: e.startDate ?? null,
          endDate: e.endDate ?? null,
          description: e.description ?? "",
          sortOrder: i,
        })),
        skills: (profile.skills ?? []).map((e: Record<string, unknown>, i: number) => ({
          skillName: e.skillName ?? "",
          proficiency: e.proficiency ?? "",
          years: e.years ?? null,
          sortOrder: i,
        })),
        certifications: (profile.certifications ?? []).map((e: Record<string, unknown>, i: number) => ({
          certificationName: e.certificationName ?? "",
          issuer: e.issuer ?? "",
          issuedDate: e.issuedDate ?? null,
          expiryDate: e.expiryDate ?? null,
          sortOrder: i,
        })),
        languages: (profile.languages ?? []).map((e: Record<string, unknown>, i: number) => ({
          languageName: e.languageName ?? "",
          proficiency: e.proficiency ?? "",
          testName: e.testName ?? "",
          testScore: e.testScore ?? "",
          sortOrder: i,
        })),
      };

      onChange(newData);
    } catch {
      setImportError("프로필을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-xs text-on-surface-variant">
          학력, 경력, 스킬 등을 입력하세요. 프로필에 미리 저장한 정보가 있다면 불러올 수 있습니다.
        </p>
        <button
          type="button"
          disabled={importing || disabled}
          onClick={handleImportFromProfile}
          className="shrink-0 rounded-lg bg-surface-container-high px-4 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50"
        >
          {importing ? "불러오는 중..." : "프로필에서 가져오기"}
        </button>
      </div>

      {importError && (
        <p className="rounded-lg bg-error-container px-4 py-2 text-xs text-destructive">{importError}</p>
      )}

      <EducationSection items={data.educations} onChange={(educations) => onChange({ ...data, educations })} disabled={disabled} />
      <ExperienceSection items={data.experiences} onChange={(experiences) => onChange({ ...data, experiences })} disabled={disabled} />
      <SkillSection items={data.skills} onChange={(skills) => onChange({ ...data, skills })} disabled={disabled} />
      <CertificationSection items={data.certifications} onChange={(certifications) => onChange({ ...data, certifications })} disabled={disabled} />
      <LanguageSection items={data.languages} onChange={(languages) => onChange({ ...data, languages })} disabled={disabled} />
    </div>
  );
}
