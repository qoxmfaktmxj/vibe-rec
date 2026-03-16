import "server-only";

import type { AttachmentSummary } from "@/entities/recruitment/attachment-model";
import {
  AdminApiError,
  getApiBaseUrl,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";

export async function getAdminAttachments(applicationId: number) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/attachments`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Admin-Session": sessionToken,
      },
    },
  );

  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;
    try {
      const errorBody = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = errorBody.message ?? errorBody.error ?? message;
    } catch {
      // Keep default message.
    }
    throw new AdminApiError(message, response.status);
  }

  return (await response.json()) as AttachmentSummary[];
}
