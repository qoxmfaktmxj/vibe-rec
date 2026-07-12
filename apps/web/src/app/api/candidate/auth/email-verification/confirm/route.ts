import { NextResponse } from "next/server";

import { CandidateApiError, confirmCandidateEmail } from "@/shared/api/candidate-auth";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { token?: string };
    if (!payload.token) {
      return NextResponse.json({ message: "확인 토큰이 없습니다." }, { status: 400 });
    }
    return NextResponse.json(await confirmCandidateEmail(payload.token));
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "이메일을 확인하지 못했습니다." }, { status: 500 });
  }
}
