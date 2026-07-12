import { NextResponse } from "next/server";

import {
  CandidateApiError,
  getCandidateAccountSessions,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";

export async function GET() {
  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    return NextResponse.json(await getCandidateAccountSessions(sessionToken));
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: "활성 세션을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
