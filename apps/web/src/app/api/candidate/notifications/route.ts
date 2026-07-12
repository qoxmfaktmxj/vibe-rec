import { NextResponse } from "next/server";

import {
  CandidateApiError,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import { ApiError, getCandidateNotifications } from "@/shared/api/recruitment";

export async function GET() {
  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    return NextResponse.json(await getCandidateNotifications(sessionToken));
  } catch (error) {
    if (error instanceof CandidateApiError || error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "알림을 불러오지 못했습니다." }, { status: 500 });
  }
}
