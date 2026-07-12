import "server-only";

import type {
  AdminCandidateDataRequest,
  UpdateAdminCandidateDataRequest,
} from "@/entities/admin/privacy-model";
import { AdminApiError, getApiBaseUrl, getRequiredAdminSessionToken } from "@/shared/api/admin-auth";

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new AdminApiError(body?.message ?? "개인정보 요청을 처리하지 못했습니다.", response.status);
  }
  return (await response.json()) as T;
}

export async function getAdminCandidateDataRequests() {
  const token = await getRequiredAdminSessionToken();
  return parseResponse<AdminCandidateDataRequest[]>(
    await fetch(`${getApiBaseUrl()}/admin/data-requests`, {
      cache: "no-store",
      headers: { "X-Admin-Session": token },
    }),
  );
}

export async function updateAdminCandidateDataRequest(
  requestId: number,
  payload: UpdateAdminCandidateDataRequest,
) {
  const token = await getRequiredAdminSessionToken();
  return parseResponse<AdminCandidateDataRequest>(
    await fetch(`${getApiBaseUrl()}/admin/data-requests/${requestId}`, {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Session": token,
      },
      body: JSON.stringify(payload),
    }),
  );
}
