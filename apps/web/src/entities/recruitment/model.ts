export type JobPostingStatus = "DRAFT" | "OPEN" | "CLOSED";

export type JobPostingStepType =
  | "DOCUMENT"
  | "ASSIGNMENT"
  | "INTERVIEW"
  | "OFFER";

export type ApplicationStatus = "DRAFT" | "SUBMITTED";
export type ApplicationReviewStatus =
  | "NEW"
  | "IN_REVIEW"
  | "PASSED"
  | "REJECTED";

export interface JobPostingSummary {
  id: number;
  publicKey: string;
  title: string;
  headline: string;
  employmentType: string;
  location: string;
  status: JobPostingStatus;
  opensAt: string;
  closesAt: string;
  stepCount: number;
}

export interface JobPostingStep {
  stepOrder: number;
  stepType: JobPostingStepType;
  title: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
}

export interface JobPostingDetail {
  id: number;
  publicKey: string;
  title: string;
  headline: string;
  description: string;
  employmentType: string;
  location: string;
  status: JobPostingStatus;
  opensAt: string;
  closesAt: string;
  steps: JobPostingStep[];
}

export interface SaveApplicationDraftPayload {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  resumePayload: Record<string, string | number>;
}

export interface ApplicationDraftResponse {
  applicationId: number;
  jobPostingId: number;
  applicantEmail: string;
  status: ApplicationStatus;
  draftSavedAt: string;
  submittedAt: string | null;
}
