export type InterviewType = "PHONE" | "VIDEO" | "ONSITE" | "TECHNICAL";
export type InterviewStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";
export type InterviewResult = "PASS" | "FAIL" | "PENDING";

export interface InterviewEvaluator {
  evaluatorId: number;
  evaluatorName: string;
  score: number | null;
  comment: string | null;
  result: InterviewResult;
  evaluatedAt: string | null;
}

export interface Interview {
  interviewId: number;
  applicationId: number;
  interviewType: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  location: string | null;
  onlineLink: string | null;
  status: InterviewStatus;
  note: string | null;
  createdAt: string;
  evaluators: InterviewEvaluator[];
}

export interface ScheduleInterviewPayload {
  interviewType: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  onlineLink?: string;
  note?: string;
}

export interface SubmitEvaluationPayload {
  score: number;
  comment?: string;
  result: InterviewResult;
}
