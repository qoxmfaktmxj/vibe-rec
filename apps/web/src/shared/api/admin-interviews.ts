import "server-only";

import type {
  Interview,
  ScheduleInterviewPayload,
  SubmitEvaluationPayload,
} from "@/entities/admin/interview-model";
import {
  AdminApiError,
  getApiBaseUrl,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;
    try {
      const errorBody = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = errorBody.message ?? errorBody.error ?? message;
    } catch {
      // ignore
    }
    throw new AdminApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export async function getAdminInterviews(applicationId: number) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/interviews`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Admin-Session": sessionToken,
      },
    },
  );
  return parseResponse<Interview[]>(response);
}

export async function scheduleInterview(
  applicationId: number,
  payload: ScheduleInterviewPayload,
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/interviews`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Admin-Session": sessionToken,
      },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<Interview>(response);
}

export async function updateInterviewStatus(
  interviewId: number,
  status: string,
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/interviews/${interviewId}/status`,
    {
      method: "PATCH",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Admin-Session": sessionToken,
      },
      body: JSON.stringify({ status }),
    },
  );
  return parseResponse<Interview>(response);
}

export async function addInterviewEvaluator(
  interviewId: number,
  evaluatorName: string,
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/interviews/${interviewId}/evaluators`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Admin-Session": sessionToken,
      },
      body: JSON.stringify({ evaluatorName }),
    },
  );
  return parseResponse<Interview>(response);
}

export async function removeInterviewEvaluator(
  interviewId: number,
  evaluatorId: number,
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/interviews/${interviewId}/evaluators/${evaluatorId}`,
    {
      method: "DELETE",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Admin-Session": sessionToken,
      },
    },
  );
  return parseResponse<Interview>(response);
}

export async function submitEvaluation(
  interviewId: number,
  evaluatorId: number,
  payload: SubmitEvaluationPayload,
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/interviews/${interviewId}/evaluators/${evaluatorId}/score`,
    {
      method: "PATCH",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Admin-Session": sessionToken,
      },
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<Interview>(response);
}
