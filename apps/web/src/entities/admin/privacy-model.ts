import type {
  CandidateDataRequest,
  CandidateDataRequestStatus,
} from "@/entities/candidate/privacy-model";

export interface AdminCandidateDataRequest extends CandidateDataRequest {
  candidateAccountId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  reviewedBy: number | null;
}

export interface UpdateAdminCandidateDataRequest {
  status: CandidateDataRequestStatus;
  resolutionNote: string;
}
