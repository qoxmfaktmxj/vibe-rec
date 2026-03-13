export type DraftFieldName =
  | "applicantName"
  | "applicantEmail"
  | "applicantPhone"
  | "introduction"
  | "coreStrength"
  | "careerYears";

export interface DraftActionState {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: Partial<Record<DraftFieldName, string>>;
  savedAt: string | null;
  applicationId: number | null;
}

export const initialDraftActionState: DraftActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  savedAt: null,
  applicationId: null,
};
