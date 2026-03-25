import "server-only";

import type {
  EvaluationResult,
  InterviewResponse,
  InterviewStatus,
} from "@/entities/recruitment/model";
import {
  AdminApiError,
  getApiBaseUrl,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `API 요청에 실패했습니다. (상태 코드: ${response.status})`;

    try {
      const errorBody = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = errorBody.message ?? errorBody.error ?? message;
    } catch {
      // Keep the default message when the response body is not JSON.
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

  return parseResponse<InterviewResponse[]>(response);
}

export async function createInterview(
  applicationId: number,
  payload: {
    jobPostingStepId: number;
    scheduledAt?: string;
    note?: string;
  },
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

  return parseResponse<InterviewResponse>(response);
}

export async function updateInterview(
  interviewId: number,
  payload: {
    status: InterviewStatus;
    note?: string;
  },
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/interviews/${interviewId}`,
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

  return parseResponse<InterviewResponse>(response);
}

export async function createEvaluation(
  interviewId: number,
  payload: {
    score: number | null;
    comment: string | null;
    result: EvaluationResult;
  },
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/interviews/${interviewId}/evaluations`,
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

  return parseResponse<InterviewResponse>(response);
}

export async function scheduleInterview(
  applicationId: number,
  payload: {
    jobPostingStepId: number;
    scheduledAt?: string | null;
    note?: string | null;
  },
) {
  return createInterview(applicationId, {
    jobPostingStepId: payload.jobPostingStepId,
    scheduledAt: payload.scheduledAt ?? undefined,
    note: payload.note ?? undefined,
  });
}

export async function updateInterviewStatus(
  interviewId: number,
  status: InterviewStatus,
) {
  return updateInterview(interviewId, { status });
}

export async function submitEvaluation(
  interviewId: number,
  _evaluatorId: number,
  payload: {
    score: number | null;
    comment?: string;
    result: EvaluationResult;
  },
) {
  return createEvaluation(interviewId, {
    score: payload.score,
    comment: payload.comment ?? null,
    result: payload.result,
  });
}

export async function addInterviewEvaluator(
  interviewId: number,
  evaluatorName: string,
) {
  void interviewId;
  void evaluatorName;
  throw new AdminApiError(
    "현재 백엔드에서는 면접관 배정을 지원하지 않습니다.",
    501,
  );
}

export async function removeInterviewEvaluator(
  interviewId: number,
  evaluatorId: number,
) {
  void interviewId;
  void evaluatorId;
  throw new AdminApiError(
    "현재 백엔드에서는 면접관 배정을 지원하지 않습니다.",
    501,
  );
}
