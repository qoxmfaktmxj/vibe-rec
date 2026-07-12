import { NextResponse } from "next/server";

import type { CandidatePasswordChangePayload } from "@/entities/candidate/model";
import {
  CandidateApiError,
  changeCandidatePassword,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import { CANDIDATE_SESSION_COOKIE } from "@/shared/lib/candidate-auth";
import { buildSessionCookieOptions } from "@/shared/lib/session-cookie";

export async function PATCH(request: Request) {
  const payload = (await request.json().catch(() => null)) as CandidatePasswordChangePayload | null;
  if (!payload?.currentPassword || !payload.newPassword) {
    return NextResponse.json(
      { message: "현재 비밀번호와 새 비밀번호를 모두 입력해 주세요." },
      { status: 400 },
    );
  }

  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    const result = await changeCandidatePassword(
      sessionToken,
      payload,
      request.headers.get("user-agent"),
    );
    const response = NextResponse.json({
      candidateAccountId: result.candidateAccountId,
      expiresAt: result.expiresAt,
    });
    response.cookies.set(
      CANDIDATE_SESSION_COOKIE,
      result.sessionToken,
      buildSessionCookieOptions(request, result.expiresAt),
    );
    return response;
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: "비밀번호를 변경하지 못했습니다." },
      { status: 500 },
    );
  }
}
