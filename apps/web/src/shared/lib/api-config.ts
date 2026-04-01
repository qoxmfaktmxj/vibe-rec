/**
 * Single source of truth for the backend API base URL.
 *
 * Priority:
 *   1. API_BASE_URL
 *   2. NEXT_PUBLIC_API_BASE_URL
 *   3. DEFAULT_API_BASE_URL
 */
const DEFAULT_API_BASE_URL = "http://127.0.0.1:8080/api";

/**
 * Resolve the backend API base URL and remove any trailing slash.
 */
export function getApiBaseUrl(): string {
  const baseUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL;

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}
