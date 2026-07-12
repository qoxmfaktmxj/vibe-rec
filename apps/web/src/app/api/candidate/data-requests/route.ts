import { NextResponse } from "next/server";

import type { CandidateDataRequestType } from "@/entities/candidate/privacy-model";
import { CandidateApiError, getRequiredCandidateSessionToken } from "@/shared/api/candidate-auth";
import {
  createCandidateDataRequest,
  getCandidateDataRequests,
} from "@/shared/api/candidate-privacy";
import { ApiError } from "@/shared/api/recruitment";

export async function GET() {
  try {
    const token = await getRequiredCandidateSessionToken();
    return NextResponse.json(await getCandidateDataRequests(token));
  } catch (error) {
    if (error instanceof CandidateApiError || error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "개인정보 요청을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    requestType?: CandidateDataRequestType;
    message?: string;
  } | null;
  if (!body?.requestType || !["DATA_EXPORT", "DATA_DELETION"].includes(body.requestType)) {
    return NextResponse.json({ message: "유효하지 않은 요청 유형입니다." }, { status: 400 });
  }
  try {
    const token = await getRequiredCandidateSessionToken();
    return NextResponse.json(
      await createCandidateDataRequest(token, body.requestType, body.message ?? ""),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CandidateApiError || error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "개인정보 요청을 등록하지 못했습니다." }, { status: 500 });
  }
}
