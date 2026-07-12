import { NextResponse } from "next/server";

import type { BulkApplicantOperationPayload } from "@/entities/admin/applicant-model";
import { AdminApiError } from "@/shared/api/admin-auth";
import { bulkUpdateAdminApplicants } from "@/shared/api/admin-applicants";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as BulkApplicantOperationPayload | null;
  if (!payload?.applicationIds?.length || payload.applicationIds.length > 100 || !payload.operation) {
    return NextResponse.json({ message: "1명 이상 100명 이하의 지원자를 선택해 주세요." }, { status: 400 });
  }
  try {
    return NextResponse.json(await bulkUpdateAdminApplicants(payload));
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "일괄 작업을 처리하지 못했습니다." }, { status: 500 });
  }
}
