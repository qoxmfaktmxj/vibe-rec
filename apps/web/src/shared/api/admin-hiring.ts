import "server-only";

import type {
  ApplicationFinalStatus,
  FinalDecisionResponse,
  NotificationResponse,
} from "@/entities/recruitment/model";
import {
  AdminApiError,
  getApiBaseUrl,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";

async function parseHiringResponse<T>(response: Response) {
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

export async function makeFinalDecision(
  applicationId: number,
  payload: {
    finalStatus: ApplicationFinalStatus;
    note?: string;
  },
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/final-decision`,
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

  return parseHiringResponse<FinalDecisionResponse>(response);
}

export async function createNotification(
  applicationId: number,
  payload: {
    type: string;
    title: string;
    content: string;
  },
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/notifications`,
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

  return parseHiringResponse<NotificationResponse>(response);
}

export async function getNotifications(applicationId: number) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/notifications`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Admin-Session": sessionToken,
      },
    },
  );

  return parseHiringResponse<NotificationResponse[]>(response);
}
