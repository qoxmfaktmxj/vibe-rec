import { NextResponse } from "next/server";

import { AdminApiError } from "@/shared/api/admin-auth";
import { removeAdminApplicantTag } from "@/shared/api/admin-applicants";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> },
) {
  const { id, tagId } = await params;
  const applicationId = Number(id);
  const numericTagId = Number(tagId);
  if (!Number.isInteger(applicationId) || applicationId <= 0 || !Number.isInteger(numericTagId) || numericTagId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 태그 요청입니다." }, { status: 400 });
  }

  try {
    return NextResponse.json(await removeAdminApplicantTag(applicationId, numericTagId));
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "태그를 제거하지 못했습니다." }, { status: 500 });
  }
}
