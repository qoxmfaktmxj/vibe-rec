import { NextResponse } from "next/server";

import { CandidateApiError, resetCandidatePassword } from "@/shared/api/candidate-auth";
import { CANDIDATE_SESSION_COOKIE } from "@/shared/lib/candidate-auth";
import { buildSessionCookieOptions } from "@/shared/lib/session-cookie";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { token?: string; newPassword?: string };
    if (!payload.token || !payload.newPassword) {
      return NextResponse.json({ message: "토큰과 새 비밀번호를 입력해 주세요." }, { status: 400 });
    }
    const response = await resetCandidatePassword(
      payload.token,
      payload.newPassword,
      request.headers.get("user-agent"),
    );
    const nextResponse = NextResponse.json({ emailVerified: response.emailVerified });
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
    return NextResponse.json({ message: "비밀번호를 재설정하지 못했습니다." }, { status: 500 });
  }
}
