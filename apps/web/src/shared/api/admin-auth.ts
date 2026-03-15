import "server-only";

import { cookies } from "next/headers";

import type {
  AdminLoginPayload,
  AdminLoginResponse,
  AdminSession,
} from "@/entities/admin/model";
import { ADMIN_SESSION_COOKIE } from "@/shared/lib/admin-auth";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8080/api";

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export function getApiBaseUrl() {
  const baseUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL;

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

async function parseAdminResponse<T>(response: Response) {
  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;

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

export async function loginAdmin(payload: AdminLoginPayload) {
  const response = await fetch(`${getApiBaseUrl()}/v1/admin/auth/login`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseAdminResponse<AdminLoginResponse>(response);
}

export async function getAdminSession(sessionToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/v1/admin/auth/session`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Admin-Session": sessionToken,
    },
  });

  return parseAdminResponse<AdminSession>(response);
}

export async function logoutAdmin(sessionToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/v1/admin/auth/logout`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "X-Admin-Session": sessionToken,
    },
  });

  if (!response.ok && response.status !== 204) {
    throw new AdminApiError("Failed to sign out.", response.status);
  }
}

export async function getCurrentAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    return await getAdminSession(sessionToken);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function getRequiredAdminSessionToken() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    throw new AdminApiError("Admin session is missing or expired.", 401);
  }

  return sessionToken;
}
