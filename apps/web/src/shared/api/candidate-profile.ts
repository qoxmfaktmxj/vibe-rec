import "server-only";

import type { CandidateProfile } from "@/entities/candidate/profile-model";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8081/api";

function getApiBaseUrl() {
  const baseUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function withCandidateSession(sessionToken: string, headers?: HeadersInit): HeadersInit {
  return { ...(headers ?? {}), "X-Candidate-Session": sessionToken };
}

export async function getCandidateProfile(sessionToken: string): Promise<CandidateProfile | null> {
  const response = await fetch(`${getApiBaseUrl()}/candidate/profile`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...withCandidateSession(sessionToken),
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  return (await response.json()) as CandidateProfile;
}

export async function saveCandidateProfile(sessionToken: string, payload: CandidateProfile): Promise<void> {
  await fetch(`${getApiBaseUrl()}/candidate/profile`, {
    method: "PUT",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...withCandidateSession(sessionToken),
    },
    body: JSON.stringify(payload),
  });
}
