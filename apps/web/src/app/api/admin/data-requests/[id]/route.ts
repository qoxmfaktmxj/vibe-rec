import { NextResponse } from "next/server";

import type { UpdateAdminCandidateDataRequest } from "@/entities/admin/privacy-model";
import { AdminApiError } from "@/shared/api/admin-auth";
import { updateAdminCandidateDataRequest } from "@/shared/api/admin-privacy";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = Number((await params).id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 요청 ID입니다." }, { status: 400 });
  }
  const body = (await request.json().catch(() => null)) as UpdateAdminCandidateDataRequest | null;
  if (!body?.status) {
    return NextResponse.json({ message: "처리 상태가 필요합니다." }, { status: 400 });
  }
  try {
    return NextResponse.json(await updateAdminCandidateDataRequest(requestId, body));
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "개인정보 요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
