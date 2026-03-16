import "server-only";

import type {
  CreateHireDecisionPayload,
  HireDecision,
  NotificationLog,
  NotificationPreview,
  NotificationTemplate,
} from "@/entities/admin/hire-model";
import {
  AdminApiError,
  getApiBaseUrl,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;
    try {
      const err = (await response.json()) as { error?: string; message?: string };
      message = err.message ?? err.error ?? message;
    } catch {
      // ignore
    }
    throw new AdminApiError(message, response.status);
  }
  return (await response.json()) as T;
}

async function headers() {
  const sessionToken = await getRequiredAdminSessionToken();
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Admin-Session": sessionToken,
  };
}

export async function getHireDecision(applicationId: number) {
  const h = await headers();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/hire-decision`,
    { cache: "no-store", headers: h },
  );
  if (response.status === 404) return null;
  return parseResponse<HireDecision | null>(response);
}

export async function createHireDecision(
  applicationId: number,
  payload: CreateHireDecisionPayload,
) {
  const h = await headers();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/hire-decision`,
    {
      method: "POST",
      cache: "no-store",
      headers: h,
      body: JSON.stringify(payload),
    },
  );
  return parseResponse<HireDecision>(response);
}

export async function getNotificationTemplates() {
  const h = await headers();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/notification-templates`,
    { cache: "no-store", headers: h },
  );
  return parseResponse<NotificationTemplate[]>(response);
}

export async function previewNotification(
  applicationId: number,
  templateId: number,
) {
  const h = await headers();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/notifications/preview/${templateId}`,
    { cache: "no-store", headers: h },
  );
  return parseResponse<NotificationPreview>(response);
}

export async function sendNotification(
  applicationId: number,
  templateId: number,
) {
  const h = await headers();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/notifications/send/${templateId}`,
    { method: "POST", cache: "no-store", headers: h },
  );
  return parseResponse<NotificationLog>(response);
}

export async function getNotificationHistory(applicationId: number) {
  const h = await headers();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/notifications`,
    { cache: "no-store", headers: h },
  );
  return parseResponse<NotificationLog[]>(response);
}
