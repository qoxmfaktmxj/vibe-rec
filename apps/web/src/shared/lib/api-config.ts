/**
 * API 서버 기본 URL 설정 (Single Source of Truth)
 *
 * 우선순위:
 *   1. API_BASE_URL         (서버 사이드 전용)
 *   2. NEXT_PUBLIC_API_BASE_URL (서버 + 클라이언트)
 *   3. DEFAULT_API_BASE_URL (하드코딩 폴백)
 */

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8081/api";

/**
 * Spring Boot API 서버의 base URL을 반환한다.
 * 환경변수가 설정되어 있으면 그 값을, 아니면 기본값을 사용한다.
 * 후행 슬래시는 자동으로 제거된다.
 */
export function getApiBaseUrl(): string {
  const baseUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL;

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}
