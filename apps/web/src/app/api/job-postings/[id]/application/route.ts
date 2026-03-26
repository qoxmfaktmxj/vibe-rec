import { NextResponse } from "next/server";

import {
  CandidateApiError,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import {
  ApiError,
  getCandidateApplicationForJobPosting,
} from "@/shared/api/recruitment";

interface CandidateApplicationRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _: Request,
  { params }: CandidateApplicationRouteProps,
) {
  const { id } = await params;
  const jobPostingId = Number(id);

  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0) {
    return NextResponse.json(
      { message: "유효하지 않은 공고 ID입니다." },
      { status: 400 },
    );
  }

  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    const response = await getCandidateApplicationForJobPosting(
      jobPostingId,
      sessionToken,
    );

    if (!response) {
      return NextResponse.json(
        { message: "지원 이력이 없습니다." },
        { status: 404 },
      );
    }

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
      { message: "지원 이력을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
