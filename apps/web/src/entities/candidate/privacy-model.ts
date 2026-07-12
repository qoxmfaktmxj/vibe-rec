export type CandidateDataRequestType = "DATA_EXPORT" | "DATA_DELETION";
export type CandidateDataRequestStatus =
  | "REQUESTED"
  | "IN_REVIEW"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface CandidateDataRequestEvent {
  id: number;
  fromStatus: CandidateDataRequestStatus | null;
  toStatus: CandidateDataRequestStatus;
  actorType: "CANDIDATE" | "ADMIN" | "SYSTEM";
  note: string | null;
  createdAt: string;
}

export interface CandidateDataRequest {
  id: number;
  requestType: CandidateDataRequestType;
  status: CandidateDataRequestStatus;
  candidateMessage: string | null;
  resolutionNote: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  events: CandidateDataRequestEvent[];
}
