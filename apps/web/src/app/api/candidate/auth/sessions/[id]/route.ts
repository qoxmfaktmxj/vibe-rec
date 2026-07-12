import { NextResponse } from "next/server";

import {
  CandidateApiError,
  getRequiredCandidateSessionToken,
  revokeCandidateAccountSession,
} from "@/shared/api/candidate-auth";
import { CANDIDATE_SESSION_COOKIE } from "@/shared/lib/candidate-auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = Number((await params).id);
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 세션 ID입니다." }, { status: 400 });
  }

  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    const result = await revokeCandidateAccountSession(sessionToken, sessionId);
    const response = NextResponse.json(result);
    if (result.currentSessionRevoked) {
      response.cookies.delete(CANDIDATE_SESSION_COOKIE);
    }
    return response;
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: "세션을 로그아웃하지 못했습니다." },
      { status: 500 },
    );
  }
}
