import { NextResponse } from "next/server";

import { AdminApiError } from "@/shared/api/admin-auth";
import { addAdminApplicantTag } from "@/shared/api/admin-applicants";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const applicationId = Number((await params).id);
  const payload = (await request.json().catch(() => null)) as { name?: string } | null;
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 지원서 ID입니다." }, { status: 400 });
  }
  if (!payload?.name?.trim()) {
    return NextResponse.json({ message: "태그 이름을 입력해 주세요." }, { status: 400 });
  }

  try {
    return NextResponse.json(await addAdminApplicantTag(applicationId, payload.name));
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "태그를 추가하지 못했습니다." }, { status: 500 });
  }
}
