import { NextResponse } from "next/server";

import {
  CandidateApiError,
  getRequiredCandidateSessionToken,
  resendCandidateEmailVerification,
} from "@/shared/api/candidate-auth";

export async function POST() {
  try {
    await resendCandidateEmailVerification(await getRequiredCandidateSessionToken());
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json(
        { message: error.message },
        {
          status: error.status,
          headers: error.retryAfter
            ? { "Retry-After": error.retryAfter }
            : undefined,
        },
      );
    }
    return NextResponse.json({ message: "확인 메일을 다시 보내지 못했습니다." }, { status: 500 });
  }
}
