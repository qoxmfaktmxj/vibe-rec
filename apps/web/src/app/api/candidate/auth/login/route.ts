import { NextResponse } from "next/server";

import type { CandidateLoginPayload } from "@/entities/candidate/model";
import { CandidateApiError, loginCandidate } from "@/shared/api/candidate-auth";
import { CANDIDATE_SESSION_COOKIE } from "@/shared/lib/candidate-auth";

export async function POST(request: Request) {
  const payload = (await request.json()) as CandidateLoginPayload;

  try {
    const response = await loginCandidate(payload);
    const nextResponse = NextResponse.json({
      candidateAccountId: response.candidateAccountId,
      email: response.email,
      name: response.name,
      phone: response.phone,
      authenticatedAt: response.authenticatedAt,
      expiresAt: response.expiresAt,
    });

    nextResponse.cookies.set(CANDIDATE_SESSION_COOKIE, response.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(response.expiresAt),
    });

    return nextResponse;
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "로그인 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
