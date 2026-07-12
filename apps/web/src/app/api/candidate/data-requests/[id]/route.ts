import { NextResponse } from "next/server";

import { CandidateApiError, getRequiredCandidateSessionToken } from "@/shared/api/candidate-auth";
import { cancelCandidateDataRequest } from "@/shared/api/candidate-privacy";
import { ApiError } from "@/shared/api/recruitment";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = Number((await params).id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 요청 ID입니다." }, { status: 400 });
  }
  try {
    const token = await getRequiredCandidateSessionToken();
    return NextResponse.json(await cancelCandidateDataRequest(token, requestId));
  } catch (error) {
    if (error instanceof CandidateApiError || error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "개인정보 요청을 취소하지 못했습니다." }, { status: 500 });
  }
}
