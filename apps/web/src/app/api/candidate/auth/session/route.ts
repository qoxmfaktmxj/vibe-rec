import { NextResponse } from "next/server";

import { CandidateApiError, getRequiredCandidateSessionToken, getCandidateSession } from "@/shared/api/candidate-auth";

export async function GET() {
  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    const session = await getCandidateSession(sessionToken);
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "세션 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}