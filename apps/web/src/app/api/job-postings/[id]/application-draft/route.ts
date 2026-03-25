import { NextResponse } from "next/server";

import type { SaveApplicationDraftPayload } from "@/entities/recruitment/model";
import { CandidateApiError, getRequiredCandidateSessionToken } from "@/shared/api/candidate-auth";
import { ApiError, saveApplicationDraft } from "@/shared/api/recruitment";

interface SaveApplicationDraftRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: SaveApplicationDraftRouteProps,
) {
  const { id } = await params;
  const jobPostingId = Number(id);

  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0) {
    return NextResponse.json(
      { message: "유효하지 않은 공고 ID입니다." },
      { status: 400 },
    );
  }

  const payload = (await request.json()) as SaveApplicationDraftPayload;

  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    const response = await saveApplicationDraft(jobPostingId, payload, sessionToken);
    return NextResponse.json(response);
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
      { message: "지원서 임시 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
