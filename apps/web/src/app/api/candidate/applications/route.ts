import { NextResponse } from "next/server";

import {
  CandidateApiError,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import { ApiError, getCandidateApplications } from "@/shared/api/recruitment";

export async function GET() {
  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    const applications = await getCandidateApplications(sessionToken);
    return NextResponse.json(applications);
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "지원 내역을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
