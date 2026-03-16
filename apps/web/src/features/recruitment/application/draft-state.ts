export type DraftFieldName =
  | "applicantName"
  | "applicantEmail"
  | "applicantPhone"
  | "introduction"
  | "coreStrength"
  | "careerYears"
  | "attachments"
  | "education"
  | "career";

export interface DraftActionState {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: Partial<Record<DraftFieldName, string>>;
  savedAt: string | null;
  submittedAt: string | null;
  applicationId: number | null;
  currentStatus: "DRAFT" | "SUBMITTED" | null;
}

export const initialDraftActionState: DraftActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  savedAt: null,
  submittedAt: null,
  applicationId: null,
  currentStatus: null,
};
