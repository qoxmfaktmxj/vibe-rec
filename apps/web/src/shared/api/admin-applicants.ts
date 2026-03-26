import "server-only";

import type {
  AdminApplicantDetail,
  AdminApplicantFilters,
  AdminApplicantSummary,
  UpdateApplicantReviewStatusPayload,
} from "@/entities/admin/applicant-model";
import {
  AdminApiError,
  getApiBaseUrl,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";

async function parseAdminApplicantResponse<T>(response: Response) {
  if (!response.ok) {
    let message = `API ?붿껌???ㅽ뙣?덉뒿?덈떎. (?곹깭 肄붾뱶: ${response.status})`;

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

function buildApplicantsQuery(filters: AdminApplicantFilters) {
  const searchParams = new URLSearchParams();

  if (filters.jobPostingId) {
    searchParams.set("jobPostingId", String(filters.jobPostingId));
  }

  if (filters.applicationStatus) {
    searchParams.set("applicationStatus", filters.applicationStatus);
  }

  if (filters.reviewStatus) {
    searchParams.set("reviewStatus", filters.reviewStatus);
  }

  if (filters.applicantName?.trim()) {
    searchParams.set("applicantName", filters.applicantName.trim());
  }

  if (filters.applicantEmail?.trim()) {
    searchParams.set("applicantEmail", filters.applicantEmail.trim());
  }

  if (filters.applicantPhone?.trim()) {
    searchParams.set("applicantPhone", filters.applicantPhone.trim());
  }

  if (filters.query?.trim()) {
    searchParams.set("query", filters.query.trim());
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getAdminApplicants(filters: AdminApplicantFilters) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants${buildApplicantsQuery(filters)}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Admin-Session": sessionToken,
      },
    },
  );

  return parseAdminApplicantResponse<AdminApplicantSummary[]>(response);
}

export async function getAdminApplicant(applicationId: number) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Admin-Session": sessionToken,
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  return parseAdminApplicantResponse<AdminApplicantDetail>(response);
}

export async function updateAdminApplicantReviewStatus(
  applicationId: number,
  payload: UpdateApplicantReviewStatusPayload,
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/review-status`,
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

  return parseAdminApplicantResponse<AdminApplicantDetail>(response);
}

