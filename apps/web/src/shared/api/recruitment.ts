import "server-only";

import type {
  CandidateApplicationDetail,
  CandidateApplicationSummary,
  ApplicationDraftResponse,
  JobPostingDetail,
  JobPostingQuestion,
  JobPostingSummary,
  SaveApplicationDraftPayload,
} from "@/entities/recruitment/model";
import { getApiBaseUrl } from "@/shared/lib/api-config";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    let message = `API 요청에 실패했습니다. (상태 코드: ${response.status})`;

    try {
      const errorBody = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = errorBody.message ?? errorBody.error ?? message;
    } catch {
      // Ignore non-JSON error responses and keep the default message.
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

async function apiFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  return parseResponse<T>(response);
}

function withCandidateSession(
  sessionToken: string,
  headers?: HeadersInit,
): HeadersInit {
  return {
    ...(headers ?? {}),
    "X-Candidate-Session": sessionToken,
  };
}

export async function getJobPostings() {
  return apiFetch<JobPostingSummary[]>("/job-postings");
}

export async function getJobPosting(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/job-postings/${id}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  return parseResponse<JobPostingDetail>(response);
}

export async function getJobPostingQuestions(id: number) {
  return apiFetch<JobPostingQuestion[]>(`/job-postings/${id}/questions`);
}

export async function saveApplicationDraft(
  jobPostingId: number,
  payload: SaveApplicationDraftPayload,
  sessionToken: string,
) {
  return apiFetch<ApplicationDraftResponse>(
    `/job-postings/${jobPostingId}/application-draft`,
    {
      method: "POST",
      headers: withCandidateSession(sessionToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    },
  );
}

export async function submitApplication(
  jobPostingId: number,
  payload: SaveApplicationDraftPayload,
  sessionToken: string,
) {
  return apiFetch<ApplicationDraftResponse>(
    `/job-postings/${jobPostingId}/application-submit`,
    {
      method: "POST",
      headers: withCandidateSession(sessionToken, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    },
  );
}

export async function getCandidateApplicationForJobPosting(
  jobPostingId: number,
  sessionToken: string,
) {
  const response = await fetch(`${getApiBaseUrl()}/job-postings/${jobPostingId}/application`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...withCandidateSession(sessionToken),
    },
  });

  if (response.status === 404) {
    return null;
  }

  return parseResponse<CandidateApplicationDetail>(response);
}

export async function getCandidateApplications(sessionToken: string) {
  return apiFetch<CandidateApplicationSummary[]>("/candidate/applications", {
    headers: withCandidateSession(sessionToken),
  });
}
