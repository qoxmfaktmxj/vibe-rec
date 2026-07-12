import { NextResponse } from "next/server";

import { AdminApiError } from "@/shared/api/admin-auth";
import { deleteAdminApplicantSavedSearch } from "@/shared/api/admin-applicants";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ savedSearchId: string }> },
) {
  const savedSearchId = Number((await params).savedSearchId);
  if (!Number.isInteger(savedSearchId) || savedSearchId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 저장 검색 ID입니다." }, { status: 400 });
  }
  try {
    await deleteAdminApplicantSavedSearch(savedSearchId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "저장된 검색을 삭제하지 못했습니다." }, { status: 500 });
  }
}
