import "server-only";

import { cookies } from "next/headers";

import type {
  CandidateLoginPayload,
  CandidateLoginResponse,
  CandidateSession,
  CandidateSignupPayload,
} from "@/entities/candidate/model";
import { getApiBaseUrl } from "@/shared/api/admin-auth";
import { CANDIDATE_SESSION_COOKIE } from "@/shared/lib/candidate-auth";

type RawCandidateSession = CandidateSession & {
  displayName?: string;
  phoneNumber?: string;
};

type RawCandidateLoginResponse = RawCandidateSession & {
  sessionToken: string;
};

export class CandidateApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CandidateApiError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

async function parseCandidateResponse<T>(response: Response) {
  if (!response.ok) {
    let message = `API request failed. (status: ${response.status})`;

    try {
      const errorBody = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = errorBody.message ?? errorBody.error ?? message;
    } catch {
      // Keep the default message.
    }

    throw new CandidateApiError(message, response.status);
  }

  return (await response.json()) as T;
}

function normalizeCandidateSession(
  session: RawCandidateSession,
): CandidateSession {
  return {
    candidateAccountId: session.candidateAccountId,
    email: session.email,
    name: session.name ?? session.displayName ?? "",
    phone: session.phone ?? session.phoneNumber ?? "",
    authenticatedAt: session.authenticatedAt,
    expiresAt: session.expiresAt,
  };
}

function normalizeCandidateLoginResponse(
  response: RawCandidateLoginResponse,
): CandidateLoginResponse {
  return {
    ...normalizeCandidateSession(response),
    sessionToken: response.sessionToken,
  };
}

export async function signupCandidate(payload: CandidateSignupPayload) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/signup`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName: payload.name,
      email: payload.email,
      phoneNumber: payload.phone,
      password: payload.password,
    }),
  });

  return normalizeCandidateLoginResponse(
    await parseCandidateResponse<RawCandidateLoginResponse>(response),
  );
}

export async function loginCandidate(payload: CandidateLoginPayload) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/login`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return normalizeCandidateLoginResponse(
    await parseCandidateResponse<RawCandidateLoginResponse>(response),
  );
}

export async function getCandidateSession(sessionToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/session`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Candidate-Session": sessionToken,
    },
  });

  return normalizeCandidateSession(
    await parseCandidateResponse<RawCandidateSession>(response),
  );
}

export async function logoutCandidate(sessionToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/logout`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "X-Candidate-Session": sessionToken,
    },
  });

  if (!response.ok && response.status !== 204) {
    throw new CandidateApiError("Candidate logout failed.", response.status);
  }
}

export async function getCurrentCandidateSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CANDIDATE_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    return await getCandidateSession(sessionToken);
  } catch (error) {
    if (error instanceof CandidateApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function getRequiredCandidateSessionToken() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CANDIDATE_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    throw new CandidateApiError("Candidate session is missing or expired.", 401);
  }

  return sessionToken;
}
