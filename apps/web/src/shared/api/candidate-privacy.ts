import "server-only";

import type {
  CandidateDataRequest,
  CandidateDataRequestType,
} from "@/entities/candidate/privacy-model";
import { getApiBaseUrl } from "@/shared/lib/api-config";
import { ApiError } from "@/shared/api/recruitment";

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? "개인정보 요청을 처리하지 못했습니다.", response.status);
  }
  return (await response.json()) as T;
}

export async function getCandidateDataRequests(sessionToken: string) {
  return parseResponse<CandidateDataRequest[]>(
    await fetch(`${getApiBaseUrl()}/candidate/data-requests`, {
      cache: "no-store",
      headers: { "X-Candidate-Session": sessionToken },
    }),
  );
}

export async function createCandidateDataRequest(
  sessionToken: string,
  requestType: CandidateDataRequestType,
  message: string,
) {
  return parseResponse<CandidateDataRequest>(
    await fetch(`${getApiBaseUrl()}/candidate/data-requests`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Candidate-Session": sessionToken,
      },
      body: JSON.stringify({ requestType, message }),
    }),
  );
}

export async function cancelCandidateDataRequest(sessionToken: string, requestId: number) {
  return parseResponse<CandidateDataRequest>(
    await fetch(`${getApiBaseUrl()}/candidate/data-requests/${requestId}`, {
      method: "DELETE",
      cache: "no-store",
      headers: { "X-Candidate-Session": sessionToken },
    }),
  );
}
