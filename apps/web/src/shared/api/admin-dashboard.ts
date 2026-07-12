import "server-only";

import type { AdminDashboard } from "@/entities/admin/dashboard-model";
import {
  AdminApiError,
  getApiBaseUrl,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";

export async function getAdminDashboard() {
  const sessionToken = await getRequiredAdminSessionToken();
  const response = await fetch(`${getApiBaseUrl()}/admin/dashboard`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Admin-Session": sessionToken,
    },
  });
  if (!response.ok) {
    let message = "운영 대시보드를 불러오지 못했습니다.";
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // Keep the safe default message.
    }
    throw new AdminApiError(message, response.status);
  }
  return (await response.json()) as AdminDashboard;
}
