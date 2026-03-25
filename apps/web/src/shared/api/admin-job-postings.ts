import "server-only";

import type { JobPostingStep } from "@/entities/recruitment/model";
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

export async function getAdminJobPostingSteps(jobPostingId: number) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/job-postings/${jobPostingId}/steps`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Admin-Session": sessionToken,
      },
    },
  );

  return parseResponse<JobPostingStep[]>(response);
}
