import { NextResponse } from "next/server";

import { CandidateApiError, getRequiredCandidateSessionToken } from "@/shared/api/candidate-auth";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8081/api";

function getApiBaseUrl() {
  const baseUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL;

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

interface AttachmentUploadRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: AttachmentUploadRouteProps,
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
    const formData = await request.formData();

    const response = await fetch(
      `${getApiBaseUrl()}/job-postings/${jobPostingId}/application-draft/attachments`,
      {
        method: "POST",
        headers: {
          "X-Candidate-Session": sessionToken,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      let message = "파일 업로드에 실패했습니다.";
      try {
        const errorBody = (await response.json()) as { message?: string };
        message = errorBody.message ?? message;
      } catch {
        // ignore non-JSON error responses
      }
      return NextResponse.json({ message }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "파일 업로드 중 서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
