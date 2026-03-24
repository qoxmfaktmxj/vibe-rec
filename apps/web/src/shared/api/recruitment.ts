import "server-only";

import type {
  ApplicationDraftResponse,
  JobPostingDetail,
  JobPostingSummary,
  SaveApplicationDraftPayload,
} from "@/entities/recruitment/model";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8081/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiBaseUrl() {
  const baseUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL;

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;

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

export async function saveApplicationDraft(
  jobPostingId: number,
  payload: SaveApplicationDraftPayload,
) {
  return apiFetch<ApplicationDraftResponse>(
    `/job-postings/${jobPostingId}/application-draft`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function submitApplication(
  jobPostingId: number,
  payload: SaveApplicationDraftPayload,
) {
  return apiFetch<ApplicationDraftResponse>(
    `/job-postings/${jobPostingId}/application-submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}
