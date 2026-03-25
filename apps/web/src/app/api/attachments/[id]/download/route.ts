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

interface AttachmentDownloadRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: AttachmentDownloadRouteProps,
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
      `${getApiBaseUrl()}/attachments/${attachmentId}/download`,
      {
        cache: "no-store",
        headers: {
          "X-Candidate-Session": sessionToken,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "파일 다운로드에 실패했습니다." },
        { status: response.status },
      );
    }

    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";
    const contentDisposition =
      response.headers.get("content-disposition") ?? "";

    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentDisposition
          ? { "Content-Disposition": contentDisposition }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "파일 다운로드 중 서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
