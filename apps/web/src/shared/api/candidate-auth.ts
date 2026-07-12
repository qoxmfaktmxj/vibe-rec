import "server-only";

import { cookies } from "next/headers";

import type {
  CandidateAccountSession,
  CandidateLoginPayload,
  CandidateLoginResponse,
  CandidatePasswordChangePayload,
  CandidateSession,
  CandidateSessionRevocationResponse,
  CandidateSignupPayload,
} from "@/entities/candidate/model";
import { getApiBaseUrl } from "@/shared/api/admin-auth";
import { CANDIDATE_SESSION_COOKIE } from "@/shared/lib/candidate-auth";
import { clientNetworkHeaders } from "@/shared/lib/client-network";

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
    readonly retryAfter?: string,
  ) {
    super(message);
    this.name = "CandidateApiError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

async function parseCandidateResponse<T>(response: Response) {
  if (!response.ok) {
    let message = `API 요청에 실패했습니다. (상태 코드: ${response.status})`;

    try {
      const errorBody = (await response.json()) as {
        error?: string;
        message?: string;
      };
      message = errorBody.message ?? errorBody.error ?? message;
    } catch {
      // Keep the default message.
    }

    throw new CandidateApiError(
      message,
      response.status,
      response.headers.get("retry-after") ?? undefined,
    );
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
    emailVerified: session.emailVerified ?? false,
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

function browserHeaders(userAgent?: string | null): Record<string, string> {
  return userAgent ? { "User-Agent": userAgent } : {};
}

export async function signupCandidate(
  payload: CandidateSignupPayload,
  userAgent?: string | null,
  clientNetwork?: string | null,
) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/signup`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...browserHeaders(userAgent),
      ...clientNetworkHeaders(clientNetwork),
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

export async function loginCandidate(
  payload: CandidateLoginPayload,
  userAgent?: string | null,
  clientNetwork?: string | null,
) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/login`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...browserHeaders(userAgent),
      ...clientNetworkHeaders(clientNetwork),
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
    throw new CandidateApiError("로그아웃에 실패했습니다.", response.status);
  }
}

export async function getCandidateAccountSessions(sessionToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/sessions`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Candidate-Session": sessionToken,
    },
  });

  return parseCandidateResponse<CandidateAccountSession[]>(response);
}

export async function revokeCandidateAccountSession(
  sessionToken: string,
  sessionId: number,
) {
  const response = await fetch(
    `${getApiBaseUrl()}/candidate/auth/sessions/${sessionId}`,
    {
      method: "DELETE",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Candidate-Session": sessionToken,
      },
    },
  );

  return parseCandidateResponse<CandidateSessionRevocationResponse>(response);
}

export async function revokeOtherCandidateAccountSessions(
  sessionToken: string,
) {
  const response = await fetch(
    `${getApiBaseUrl()}/candidate/auth/sessions/others`,
    {
      method: "DELETE",
      cache: "no-store",
      headers: { "X-Candidate-Session": sessionToken },
    },
  );

  if (!response.ok) {
    await parseCandidateResponse<never>(response);
  }
}

export async function changeCandidatePassword(
  sessionToken: string,
  payload: CandidatePasswordChangePayload,
  userAgent?: string | null,
) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/password`, {
    method: "PATCH",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Candidate-Session": sessionToken,
      ...browserHeaders(userAgent),
    },
    body: JSON.stringify(payload),
  });

  return normalizeCandidateLoginResponse(
    await parseCandidateResponse<RawCandidateLoginResponse>(response),
  );
}

export async function resendCandidateEmailVerification(sessionToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/email-verification`, {
    method: "POST",
    cache: "no-store",
    headers: { "X-Candidate-Session": sessionToken },
  });
  if (!response.ok && response.status !== 202) {
    await parseCandidateResponse<never>(response);
  }
}

export async function confirmCandidateEmail(token: string) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/email-verification/confirm`, {
    method: "POST",
    cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return parseCandidateResponse<{ emailVerified: boolean }>(response);
}

export async function requestCandidatePasswordReset(email: string, clientNetwork?: string | null) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/password-reset`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...clientNetworkHeaders(clientNetwork),
    },
    body: JSON.stringify({ email }),
  });
  if (!response.ok && response.status !== 202) {
    await parseCandidateResponse<never>(response);
  }
}

export async function resetCandidatePassword(
  token: string,
  newPassword: string,
  userAgent?: string | null,
) {
  const response = await fetch(`${getApiBaseUrl()}/candidate/auth/password-reset/confirm`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...browserHeaders(userAgent),
    },
    body: JSON.stringify({ token, newPassword }),
  });
  return normalizeCandidateLoginResponse(
    await parseCandidateResponse<RawCandidateLoginResponse>(response),
  );
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
    throw new CandidateApiError("지원자 세션이 만료되었거나 없습니다.", 401);
  }

  return sessionToken;
}
