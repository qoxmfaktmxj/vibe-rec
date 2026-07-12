import { NextResponse } from "next/server";

import {
  CandidateApiError,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import { ApiError, withdrawCandidateApplication } from "@/shared/api/recruitment";

interface WithdrawApplicationRouteProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: Request,
  { params }: WithdrawApplicationRouteProps,
) {
  const applicationId = Number((await params).id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 지원서 ID입니다." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { reason?: string } | null;
  const reason = body?.reason?.trim();
  if (!reason) {
    return NextResponse.json({ message: "철회 사유를 입력해 주세요." }, { status: 400 });
  }

  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    return NextResponse.json(
      await withdrawCandidateApplication(applicationId, reason, sessionToken),
    );
  } catch (error) {
    if (error instanceof CandidateApiError || error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "지원을 철회하지 못했습니다." }, { status: 500 });
  }
}
