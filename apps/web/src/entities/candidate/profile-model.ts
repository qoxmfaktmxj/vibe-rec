export interface CandidateProfile {
  introductionTemplate: string | null;
  coreStrengthTemplate: string | null;
  careerYears: number | null;
  educations: ProfileEducation[];
  experiences: ProfileExperience[];
  skills: ProfileSkill[];
  certifications: ProfileCertification[];
  languages: ProfileLanguage[];
}

export interface ProfileEducation {
  id?: number;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
  sortOrder: number;
}

export interface ProfileExperience {
  id?: number;
  company: string;
  position: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
  sortOrder: number;
}

export interface ProfileSkill {
  id?: number;
  skillName: string;
  proficiency: string;
  years: number | null;
  sortOrder: number;
}

export interface ProfileCertification {
  id?: number;
  certificationName: string;
  issuer: string;
  issuedDate: string | null;
  expiryDate: string | null;
  sortOrder: number;
}

export interface ProfileLanguage {
  id?: number;
  languageName: string;
  proficiency: string;
  testName: string;
  testScore: string;
  sortOrder: number;
}
