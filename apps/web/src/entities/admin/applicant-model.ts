import type {
  ApplicationFinalStatus,
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
  assignedAdminId: number | null;
  assignedAdminName: string | null;
  tags: AdminApplicantTag[];
  draftSavedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  withdrawnAt: string | null;
  withdrawalReason: string | null;
}

export interface AdminApplicantPage {
  items: AdminApplicantSummary[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
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
  introduction: string | null;
  coreStrength: string | null;
  careerYears: number | null;
  finalStatus: ApplicationFinalStatus | null;
  finalDecidedAt: string | null;
  finalNote: string | null;
}

export interface AdminApplicantFilters {
  jobPostingId?: number;
  applicationStatus?: ApplicationStatus;
  reviewStatus?: ApplicationReviewStatus;
  assignedAdminId?: number;
  tagId?: number;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  query?: string;
  sort?: AdminApplicantSortField;
  direction?: AdminSortDirection;
  page?: number;
  size?: number;
}

export interface AdminApplicantTag {
  id: number;
  name: string;
}

export interface AdminAssignee {
  id: number;
  displayName: string;
}

export interface AdminApplicantOptions {
  assignees: AdminAssignee[];
  tags: AdminApplicantTag[];
}

export type AdminApplicantSortField =
  | "SUBMITTED_AT"
  | "APPLICANT_NAME"
  | "REVIEWED_AT"
  | "UPDATED_AT";

export type AdminSortDirection = "ASC" | "DESC";

export interface AdminApplicantSavedSearch {
  id: number;
  name: string;
  filters: Record<string, string>;
  createdAt: string;
}

export type BulkApplicantOperation = "ASSIGN" | "ADD_TAG" | "REMOVE_TAG";

export interface BulkApplicantOperationPayload {
  applicationIds: number[];
  operation: BulkApplicantOperation;
  adminAccountId?: number | null;
  tagName?: string;
  tagId?: number;
}

export interface BulkApplicantOperationResponse {
  operation: BulkApplicantOperation;
  requestedCount: number;
  changedCount: number;
}

export interface UpdateApplicantReviewStatusPayload {
  reviewStatus: ApplicationReviewStatus;
  reviewNote: string;
}
