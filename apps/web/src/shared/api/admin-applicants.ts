import "server-only";

import type {
  AdminApplicantDetail,
  AdminApplicantFilters,
  AdminApplicantPage,
  AdminApplicantOptions,
  AdminApplicantSavedSearch,
  BulkApplicantOperationPayload,
  BulkApplicantOperationResponse,
  UpdateApplicantReviewStatusPayload,
} from "@/entities/admin/applicant-model";
import {
  AdminApiError,
  getApiBaseUrl,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";

async function parseAdminApplicantResponse<T>(response: Response) {
  if (!response.ok) {
    let message = `Admin applicant request failed. (status: ${response.status})`;

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

  if (filters.assignedAdminId) {
    searchParams.set("assignedAdminId", String(filters.assignedAdminId));
  }

  if (filters.tagId) {
    searchParams.set("tagId", String(filters.tagId));
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

  if (filters.sort) {
    searchParams.set("sort", filters.sort);
  }

  if (filters.direction) {
    searchParams.set("direction", filters.direction);
  }

  if (filters.page && filters.page > 1) {
    searchParams.set("page", String(filters.page));
  }

  if (filters.size) {
    searchParams.set("size", String(filters.size));
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

  return parseAdminApplicantResponse<AdminApplicantPage>(response);
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

export async function getAdminApplicantOptions() {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(`${getApiBaseUrl()}/admin/applicants/options`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Admin-Session": sessionToken,
    },
  });
  return parseAdminApplicantResponse<AdminApplicantOptions>(response);
}

export async function updateAdminApplicantAssignee(
  applicationId: number,
  adminAccountId: number | null,
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/assignee`,
    {
      method: "PATCH",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Admin-Session": sessionToken,
      },
      body: JSON.stringify({ adminAccountId }),
    },
  );
  return parseAdminApplicantResponse<AdminApplicantDetail>(response);
}

export async function addAdminApplicantTag(applicationId: number, name: string) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(`${getApiBaseUrl()}/admin/applicants/${applicationId}/tags`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Admin-Session": sessionToken,
    },
    body: JSON.stringify({ name }),
  });
  return parseAdminApplicantResponse<AdminApplicantDetail>(response);
}

export async function removeAdminApplicantTag(applicationId: number, tagId: number) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(
    `${getApiBaseUrl()}/admin/applicants/${applicationId}/tags/${tagId}`,
    {
      method: "DELETE",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Admin-Session": sessionToken,
      },
    },
  );
  return parseAdminApplicantResponse<AdminApplicantDetail>(response);
}

export async function getAdminApplicantSavedSearches() {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(`${getApiBaseUrl()}/admin/applicants/saved-searches`, {
    cache: "no-store",
    headers: { Accept: "application/json", "X-Admin-Session": sessionToken },
  });
  return parseAdminApplicantResponse<AdminApplicantSavedSearch[]>(response);
}

export async function createAdminApplicantSavedSearch(
  name: string,
  filters: Record<string, string>,
) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(`${getApiBaseUrl()}/admin/applicants/saved-searches`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Admin-Session": sessionToken,
    },
    body: JSON.stringify({ name, filters }),
  });
  return parseAdminApplicantResponse<AdminApplicantSavedSearch>(response);
}

export async function deleteAdminApplicantSavedSearch(savedSearchId: number) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(`${getApiBaseUrl()}/admin/applicants/saved-searches/${savedSearchId}`, {
    method: "DELETE",
    cache: "no-store",
    headers: { "X-Admin-Session": sessionToken },
  });
  if (!response.ok) {
    await parseAdminApplicantResponse<never>(response);
  }
}

export async function bulkUpdateAdminApplicants(payload: BulkApplicantOperationPayload) {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(`${getApiBaseUrl()}/admin/applicants/bulk`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Admin-Session": sessionToken,
    },
    body: JSON.stringify(payload),
  });
  return parseAdminApplicantResponse<BulkApplicantOperationResponse>(response);
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
