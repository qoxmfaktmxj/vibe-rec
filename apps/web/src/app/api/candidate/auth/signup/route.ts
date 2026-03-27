import { NextResponse } from "next/server";

import type { CandidateSignupPayload } from "@/entities/candidate/model";
import { CandidateApiError, signupCandidate } from "@/shared/api/candidate-auth";
import { CANDIDATE_SESSION_COOKIE } from "@/shared/lib/candidate-auth";
import { buildSessionCookieOptions } from "@/shared/lib/session-cookie";

export async function POST(request: Request) {
  const payload = (await request.json()) as CandidateSignupPayload;

  try {
    const response = await signupCandidate(payload);
    const nextResponse = NextResponse.json({
      candidateAccountId: response.candidateAccountId,
      email: response.email,
      name: response.name,
      phone: response.phone,
      authenticatedAt: response.authenticatedAt,
      expiresAt: response.expiresAt,
    });

    nextResponse.cookies.set(
      CANDIDATE_SESSION_COOKIE,
      response.sessionToken,
      buildSessionCookieOptions(request, response.expiresAt),
    );

    return nextResponse;
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
