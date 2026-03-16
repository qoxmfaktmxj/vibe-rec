import type {
  ApplicationStatus,
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumeSkill,
} from "@/entities/recruitment/model";

export type ApplicationReviewStatus =
  | "NEW"
  | "IN_REVIEW"
  | "PASSED"
  | "REJECTED";

export interface AdminApplicantSummary {
  applicationId: number;
  jobPostingId: number;
  jobPostingTitle: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicationStatus: ApplicationStatus;
  reviewStatus: ApplicationReviewStatus;
  draftSavedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
}

export interface AdminApplicantDetail extends AdminApplicantSummary {
  jobPostingPublicKey: string;
  reviewNote: string | null;
  resumePayload: Record<string, unknown>;
  educations: ResumeEducation[];
  experiences: ResumeExperience[];
  skills: ResumeSkill[];
  certifications: ResumeCertification[];
  languages: ResumeLanguage[];
}

export interface AdminApplicantFilters {
  jobPostingId?: number;
  applicationStatus?: ApplicationStatus;
  reviewStatus?: ApplicationReviewStatus;
  query?: string;
}

export interface UpdateApplicantReviewStatusPayload {
  reviewStatus: ApplicationReviewStatus;
  reviewNote: string;
}
