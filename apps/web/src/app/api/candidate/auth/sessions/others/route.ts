import { NextResponse } from "next/server";

import {
  CandidateApiError,
  getRequiredCandidateSessionToken,
  revokeOtherCandidateAccountSessions,
} from "@/shared/api/candidate-auth";

export async function DELETE() {
  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    await revokeOtherCandidateAccountSessions(sessionToken);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: "다른 세션을 로그아웃하지 못했습니다." },
      { status: 500 },
    );
  }
}
