import { NextResponse } from "next/server";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8080/api";

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
      { message: "Invalid attachment id." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/attachments/${attachmentId}`,
      { method: "DELETE" },
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
  } catch {
    return NextResponse.json(
      { message: "파일 삭제 중 서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
