import { NextResponse } from "next/server";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8080/api";

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
      { message: "Invalid job posting id." },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const applicantEmail = url.searchParams.get("applicantEmail");

  if (!applicantEmail) {
    return NextResponse.json(
      { message: "applicantEmail query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const formData = await request.formData();

    const backendUrl = `${getApiBaseUrl()}/job-postings/${jobPostingId}/application-draft/attachments?applicantEmail=${encodeURIComponent(applicantEmail)}`;

    const response = await fetch(backendUrl, {
      method: "POST",
      body: formData,
    });

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
  } catch {
    return NextResponse.json(
      { message: "파일 업로드 중 서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
