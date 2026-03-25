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

interface AttachmentDeleteRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  _request: Request,
  { params }: AttachmentDeleteRouteProps,
) {
  const { id } = await params;
  const attachmentId = Number(id);

  if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
    return NextResponse.json(
      { message: "유효하지 않은 첨부파일 ID입니다." },
      { status: 400 },
    );
  }

  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    const response = await fetch(
      `${getApiBaseUrl()}/attachments/${attachmentId}`,
      {
        method: "DELETE",
        headers: {
          "X-Candidate-Session": sessionToken,
        },
      },
    );

    if (!response.ok) {
      let message = "파일 삭제에 실패했습니다.";
      try {
        const errorBody = (await response.json()) as { message?: string };
        message = errorBody.message ?? message;
      } catch {
        // ignore non-JSON error responses
      }
      return NextResponse.json({ message }, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "파일 삭제 중 서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
