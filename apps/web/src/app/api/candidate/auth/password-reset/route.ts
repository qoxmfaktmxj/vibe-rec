import { NextResponse } from "next/server";

import { CandidateApiError, requestCandidatePasswordReset } from "@/shared/api/candidate-auth";
import { getClientNetwork } from "@/shared/lib/client-network";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string };
    if (!payload.email) {
      return NextResponse.json({ message: "이메일을 입력해 주세요." }, { status: 400 });
    }
    await requestCandidatePasswordReset(payload.email, getClientNetwork(request));
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
    return NextResponse.json({ message: "재설정 요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
