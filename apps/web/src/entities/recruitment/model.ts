export type JobPostingStatus = "DRAFT" | "OPEN" | "CLOSED";
export type RecruitmentCategory = "NEW_GRAD" | "EXPERIENCED";
export type RecruitmentMode = "FIXED_TERM" | "ROLLING";

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
  recruitmentCategory: RecruitmentCategory;
  recruitmentMode: RecruitmentMode;
  location: string;
  status: JobPostingStatus;
  opensAt: string;
  closesAt: string | null;
  stepCount: number;
}

export interface JobPostingStep {
  id?: number;
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
  recruitmentCategory: RecruitmentCategory;
  recruitmentMode: RecruitmentMode;
  location: string;
  status: JobPostingStatus;
  opensAt: string;
  closesAt: string | null;
  steps: JobPostingStep[];
}

export interface ResumeEducation {
  id?: number;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
  sortOrder: number;
}

export interface ResumeExperience {
  id?: number;
  company: string;
  position: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
  sortOrder: number;
}

export interface ResumeSkill {
  id?: number;
  skillName: string;
  proficiency: string;
  years: number | null;
  sortOrder: number;
}

export interface ResumeCertification {
  id?: number;
  certificationName: string;
  issuer: string;
  issuedDate: string | null;
  expiryDate: string | null;
  sortOrder: number;
}

export interface ResumeLanguage {
  id?: number;
  languageName: string;
  proficiency: string;
  testName: string;
  testScore: string;
  sortOrder: number;
}

export interface SaveApplicationDraftPayload {
  resumePayload: Record<string, unknown>;
  educations?: ResumeEducation[];
  experiences?: ResumeExperience[];
  skills?: ResumeSkill[];
  certifications?: ResumeCertification[];
  languages?: ResumeLanguage[];
}

export interface ApplicationDraftResponse {
  applicationId: number;
  jobPostingId: number;
  applicantEmail?: string;
  status: ApplicationStatus;
  draftSavedAt: string;
  submittedAt: string | null;
}

export interface CandidateApplicationSummary {
  applicationId: number;
  jobPostingId: number;
  jobPostingPublicKey: string;
  jobPostingTitle: string;
  jobPostingHeadline: string;
  employmentType: string;
  location: string;
  status: ApplicationStatus;
  reviewStatus: ApplicationReviewStatus;
  finalStatus: ApplicationFinalStatus | null;
  draftSavedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  finalDecidedAt: string | null;
}

export interface CandidateApplicationDetail extends ApplicationDraftResponse {
  jobPostingTitle: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  reviewStatus: ApplicationReviewStatus;
  finalStatus: ApplicationFinalStatus | null;
  reviewedAt: string | null;
  finalDecidedAt: string | null;
  resumePayload: Record<string, unknown>;
  educations: ResumeEducation[];
  experiences: ResumeExperience[];
  skills: ResumeSkill[];
  certifications: ResumeCertification[];
  languages: ResumeLanguage[];
  currentStep: number;
  motivationFit: string | null;
  answers: ApplicationAnswer[];
}

// 첨부파일
export type ApplicationAttachment = {
  id: number;
  applicationId: number;
  originalName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
};

// 정규화 - 교육 이력
export type ApplicationEducation = {
  id?: number;
  schoolName: string;
  major: string;
  degree: string;
  graduatedAt: string;
  sortOrder: number;
};

// 정규화 - 경력 이력
export type ApplicationCareer = {
  id?: number;
  companyName: string;
  position: string;
  startedAt: string;
  endedAt: string;
  description: string;
  sortOrder: number;
};

// 면접
export type InterviewStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type EvaluationResult = "PENDING" | "PASS" | "FAIL" | "HOLD";

export type EvaluationResponse = {
  id: number;
  interviewId: number;
  evaluatorId: number;
  evaluatorName: string;
  score: number | null;
  comment: string | null;
  result: EvaluationResult;
  createdAt: string;
};

export type InterviewResponse = {
  id: number;
  applicationId: number;
  jobPostingStepId: number;
  stepTitle: string;
  stepType: string;
  scheduledAt: string | null;
  status: InterviewStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  evaluations: EvaluationResponse[];
};

// 최종 결정
export type ApplicationFinalStatus =
  | "OFFER_MADE"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN";

export type FinalDecisionResponse = {
  applicationId: number;
  finalStatus: ApplicationFinalStatus;
  finalDecidedAt: string;
  finalNote: string | null;
};

// 통지 이력
export type NotificationResponse = {
  id: number;
  applicationId: number;
  type: string;
  title: string;
  content: string;
  sentBy: number | null;
  sentByName: string | null;
  createdAt: string;
};

// 공고별 질문
export type QuestionType = "TEXT" | "CHOICE" | "SCALE";

export interface JobPostingQuestion {
  id: number;
  questionText: string;
  questionType: QuestionType;
  choices: string | null;
  required: boolean;
  sortOrder: number;
}

export interface ApplicationAnswer {
  questionId: number;
  answerText: string | null;
  answerChoice: string | null;
  answerScale: number | null;
}
