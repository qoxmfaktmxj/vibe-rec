"use client";

import type {
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumeSkill,
} from "@/entities/recruitment/model";

const inputClassName =
  "w-full rounded-lg border-none bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20";

const sectionHeaderClassName =
  "flex items-center justify-between text-sm font-semibold text-on-surface-variant";

const addButtonClassName =
  "rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-50";

const removeButtonClassName =
  "shrink-0 rounded-lg px-2 py-1 text-xs text-outline transition hover:bg-error-container hover:text-destructive";

const cardClassName =
  "space-y-3 rounded-lg bg-surface-container-low p-4";

// --- Education ---

interface EducationSectionProps {
  items: ResumeEducation[];
  onChange: (items: ResumeEducation[]) => void;
  disabled: boolean;
}

function emptyEducation(sortOrder: number): ResumeEducation {
  return { institution: "", degree: "", fieldOfStudy: "", startDate: null, endDate: null, description: "", sortOrder };
}

export function EducationSection({ items, onChange, disabled }: EducationSectionProps) {
  function updateItem(index: number, patch: Partial<ResumeEducation>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      <div className={sectionHeaderClassName}>
        <span>학력</span>
        <button type="button" disabled={disabled} className={addButtonClassName}
          onClick={() => onChange([...items, emptyEducation(items.length)])}>
          + 추가
        </button>
      </div>
      {items.map((edu, idx) => (
        <div key={idx} className={cardClassName}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-outline">학력 {idx + 1}</span>
            <button type="button" disabled={disabled} className={removeButtonClassName}
              onClick={() => onChange(items.filter((_, i) => i !== idx).map((e, i) => ({ ...e, sortOrder: i })))}>
              삭제
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="학교명 *" disabled={disabled} className={inputClassName}
              value={edu.institution} onChange={(e) => updateItem(idx, { institution: e.target.value })} />
            <input placeholder="학위 (학사, 석사 등)" disabled={disabled} className={inputClassName}
              value={edu.degree} onChange={(e) => updateItem(idx, { degree: e.target.value })} />
            <input placeholder="전공" disabled={disabled} className={inputClassName}
              value={edu.fieldOfStudy} onChange={(e) => updateItem(idx, { fieldOfStudy: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" disabled={disabled} className={inputClassName} title="시작일"
                value={edu.startDate ?? ""} onChange={(e) => updateItem(idx, { startDate: e.target.value || null })} />
              <input type="date" disabled={disabled} className={inputClassName} title="종료일 (재학 중이면 비워두세요)"
                value={edu.endDate ?? ""} onChange={(e) => updateItem(idx, { endDate: e.target.value || null })} />
            </div>
          </div>
          <textarea placeholder="설명 (선택)" rows={2} disabled={disabled}
            className={`resize-y ${inputClassName}`}
            value={edu.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

// --- Experience ---

interface ExperienceSectionProps {
  items: ResumeExperience[];
  onChange: (items: ResumeExperience[]) => void;
  disabled: boolean;
}

function emptyExperience(sortOrder: number): ResumeExperience {
  return { company: "", position: "", startDate: null, endDate: null, description: "", sortOrder };
}

export function ExperienceSection({ items, onChange, disabled }: ExperienceSectionProps) {
  function updateItem(index: number, patch: Partial<ResumeExperience>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      <div className={sectionHeaderClassName}>
        <span>경력</span>
        <button type="button" disabled={disabled} className={addButtonClassName}
          onClick={() => onChange([...items, emptyExperience(items.length)])}>
          + 추가
        </button>
      </div>
      {items.map((exp, idx) => (
        <div key={idx} className={cardClassName}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-outline">경력 {idx + 1}</span>
            <button type="button" disabled={disabled} className={removeButtonClassName}
              onClick={() => onChange(items.filter((_, i) => i !== idx).map((e, i) => ({ ...e, sortOrder: i })))}>
              삭제
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="회사명 *" disabled={disabled} className={inputClassName}
              value={exp.company} onChange={(e) => updateItem(idx, { company: e.target.value })} />
            <input placeholder="직책/직급" disabled={disabled} className={inputClassName}
              value={exp.position} onChange={(e) => updateItem(idx, { position: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" disabled={disabled} className={inputClassName} title="시작일"
                value={exp.startDate ?? ""} onChange={(e) => updateItem(idx, { startDate: e.target.value || null })} />
              <input type="date" disabled={disabled} className={inputClassName} title="종료일 (재직 중이면 비워두세요)"
                value={exp.endDate ?? ""} onChange={(e) => updateItem(idx, { endDate: e.target.value || null })} />
            </div>
          </div>
          <textarea placeholder="담당 업무 설명 (선택)" rows={2} disabled={disabled}
            className={`resize-y ${inputClassName}`}
            value={exp.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

// --- Skill ---

interface SkillSectionProps {
  items: ResumeSkill[];
  onChange: (items: ResumeSkill[]) => void;
  disabled: boolean;
}

function emptySkill(sortOrder: number): ResumeSkill {
  return { skillName: "", proficiency: "", years: null, sortOrder };
}

const proficiencyOptions = [
  { value: "", label: "숙련도 선택" },
  { value: "BEGINNER", label: "초급" },
  { value: "INTERMEDIATE", label: "중급" },
  { value: "ADVANCED", label: "고급" },
  { value: "EXPERT", label: "전문가" },
];

export function SkillSection({ items, onChange, disabled }: SkillSectionProps) {
  function updateItem(index: number, patch: Partial<ResumeSkill>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      <div className={sectionHeaderClassName}>
        <span>스킬</span>
        <button type="button" disabled={disabled} className={addButtonClassName}
          onClick={() => onChange([...items, emptySkill(items.length)])}>
          + 추가
        </button>
      </div>
      {items.map((skill, idx) => (
        <div key={idx} className={`flex items-center gap-3 ${cardClassName}`}>
          <input placeholder="스킬명 *" disabled={disabled} className={`flex-1 ${inputClassName}`}
            value={skill.skillName} onChange={(e) => updateItem(idx, { skillName: e.target.value })} />
          <select disabled={disabled} className={inputClassName} value={skill.proficiency}
            onChange={(e) => updateItem(idx, { proficiency: e.target.value })}>
            {proficiencyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input type="number" min={0} max={40} placeholder="경력(년)" disabled={disabled}
            className={`w-24 ${inputClassName}`}
            value={skill.years ?? ""} onChange={(e) => updateItem(idx, { years: e.target.value ? Number(e.target.value) : null })} />
          <button type="button" disabled={disabled} className={removeButtonClassName}
            onClick={() => onChange(items.filter((_, i) => i !== idx).map((e, i) => ({ ...e, sortOrder: i })))}>
            삭제
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Certification ---

interface CertificationSectionProps {
  items: ResumeCertification[];
  onChange: (items: ResumeCertification[]) => void;
  disabled: boolean;
}

function emptyCertification(sortOrder: number): ResumeCertification {
  return { certificationName: "", issuer: "", issuedDate: null, expiryDate: null, sortOrder };
}

export function CertificationSection({ items, onChange, disabled }: CertificationSectionProps) {
  function updateItem(index: number, patch: Partial<ResumeCertification>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      <div className={sectionHeaderClassName}>
        <span>자격증</span>
        <button type="button" disabled={disabled} className={addButtonClassName}
          onClick={() => onChange([...items, emptyCertification(items.length)])}>
          + 추가
        </button>
      </div>
      {items.map((cert, idx) => (
        <div key={idx} className={cardClassName}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-outline">자격증 {idx + 1}</span>
            <button type="button" disabled={disabled} className={removeButtonClassName}
              onClick={() => onChange(items.filter((_, i) => i !== idx).map((e, i) => ({ ...e, sortOrder: i })))}>
              삭제
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="자격증명 *" disabled={disabled} className={inputClassName}
              value={cert.certificationName} onChange={(e) => updateItem(idx, { certificationName: e.target.value })} />
            <input placeholder="발급 기관" disabled={disabled} className={inputClassName}
              value={cert.issuer} onChange={(e) => updateItem(idx, { issuer: e.target.value })} />
            <input type="date" disabled={disabled} className={inputClassName} title="취득일"
              value={cert.issuedDate ?? ""} onChange={(e) => updateItem(idx, { issuedDate: e.target.value || null })} />
            <input type="date" disabled={disabled} className={inputClassName} title="만료일 (무기한이면 비워두세요)"
              value={cert.expiryDate ?? ""} onChange={(e) => updateItem(idx, { expiryDate: e.target.value || null })} />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Language ---

interface LanguageSectionProps {
  items: ResumeLanguage[];
  onChange: (items: ResumeLanguage[]) => void;
  disabled: boolean;
}

function emptyLanguage(sortOrder: number): ResumeLanguage {
  return { languageName: "", proficiency: "", testName: "", testScore: "", sortOrder };
}

const languageProficiencyOptions = [
  { value: "", label: "수준 선택" },
  { value: "BASIC", label: "기초" },
  { value: "CONVERSATIONAL", label: "일상회화" },
  { value: "FLUENT", label: "유창" },
  { value: "NATIVE", label: "원어민" },
];

export function LanguageSection({ items, onChange, disabled }: LanguageSectionProps) {
  function updateItem(index: number, patch: Partial<ResumeLanguage>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      <div className={sectionHeaderClassName}>
        <span>어학</span>
        <button type="button" disabled={disabled} className={addButtonClassName}
          onClick={() => onChange([...items, emptyLanguage(items.length)])}>
          + 추가
        </button>
      </div>
      {items.map((lang, idx) => (
        <div key={idx} className={cardClassName}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-outline">어학 {idx + 1}</span>
            <button type="button" disabled={disabled} className={removeButtonClassName}
              onClick={() => onChange(items.filter((_, i) => i !== idx).map((e, i) => ({ ...e, sortOrder: i })))}>
              삭제
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="언어 *" disabled={disabled} className={inputClassName}
              value={lang.languageName} onChange={(e) => updateItem(idx, { languageName: e.target.value })} />
            <select disabled={disabled} className={inputClassName} value={lang.proficiency}
              onChange={(e) => updateItem(idx, { proficiency: e.target.value })}>
              {languageProficiencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input placeholder="시험명 (TOEIC, JLPT 등)" disabled={disabled} className={inputClassName}
              value={lang.testName} onChange={(e) => updateItem(idx, { testName: e.target.value })} />
            <input placeholder="점수/등급" disabled={disabled} className={inputClassName}
              value={lang.testScore} onChange={(e) => updateItem(idx, { testScore: e.target.value })} />
          </div>
        </div>
      ))}
    </div>
  );
}
