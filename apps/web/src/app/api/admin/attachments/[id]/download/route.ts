import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/shared/lib/admin-auth";
import { getApiBaseUrl } from "@/shared/lib/api-config";

interface DownloadRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: DownloadRouteProps,
) {
  const { id } = await params;
  const attachmentId = Number(id);

  if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
    return NextResponse.json(
      { message: "유효하지 않은 첨부파일 ID입니다." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return NextResponse.json(
      { message: "관리자 세션이 없습니다." },
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
