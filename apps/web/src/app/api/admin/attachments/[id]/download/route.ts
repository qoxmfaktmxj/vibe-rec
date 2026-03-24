import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/shared/lib/admin-auth";

interface DownloadRouteProps {
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

export async function GET(
  _request: Request,
  { params }: DownloadRouteProps,
) {
  const { id } = await params;
  const attachmentId = Number(id);

  if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
    return NextResponse.json(
      { message: "Invalid attachment id." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return NextResponse.json(
      { message: "Admin session is missing." },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/admin/attachments/${attachmentId}/download`,
      {
        headers: {
          "X-Admin-Session": sessionToken,
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
      response.headers.get("Content-Type") ?? "application/octet-stream";
    const contentDisposition =
      response.headers.get("Content-Disposition") ?? "";

    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json(
      { message: "파일 다운로드에 실패했습니다." },
      { status: 500 },
    );
  }
}
