import { NextResponse } from "next/server";

import { CandidateApiError, getRequiredCandidateSessionToken } from "@/shared/api/candidate-auth";

interface AttachmentRouteProps {
  params: Promise<{
    id: string;
  }>;
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8081/api";

function getApiBaseUrl() {
  const baseUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL;

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export async function POST(
  request: Request,
  { params }: AttachmentRouteProps,
) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json(
      { message: "유효하지 않은 지원서 ID입니다." },
      { status: 400 },
    );
  }

  const formData = await request.formData();

  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    const response = await fetch(
      `${getApiBaseUrl()}/applications/${applicationId}/attachments`,
      {
        method: "POST",
        headers: {
          "X-Candidate-Session": sessionToken,
        },
        body: formData,
      },
    );

    const body = await response.json();

    if (!response.ok) {
      return NextResponse.json(body, { status: response.status });
    }

    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "파일 업로드에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: AttachmentRouteProps,
) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json(
      { message: "유효하지 않은 지원서 ID입니다." },
      { status: 400 },
    );
  }

  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    const response = await fetch(
      `${getApiBaseUrl()}/applications/${applicationId}/attachments`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "X-Candidate-Session": sessionToken,
        },
      },
    );

    const body = await response.json();

    if (!response.ok) {
      return NextResponse.json(body, { status: response.status });
    }

    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "첨부파일 목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}
