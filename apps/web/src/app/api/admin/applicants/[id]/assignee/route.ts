import { NextResponse } from "next/server";

import { AdminApiError } from "@/shared/api/admin-auth";
import { updateAdminApplicantAssignee } from "@/shared/api/admin-applicants";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const applicationId = Number((await params).id);
  const payload = (await request.json().catch(() => null)) as { adminAccountId?: number | null } | null;
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 지원서 ID입니다." }, { status: 400 });
  }
  if (payload?.adminAccountId != null && (!Number.isInteger(payload.adminAccountId) || payload.adminAccountId <= 0)) {
    return NextResponse.json({ message: "유효하지 않은 담당자 ID입니다." }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await updateAdminApplicantAssignee(applicationId, payload?.adminAccountId ?? null),
    );
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "담당자를 변경하지 못했습니다." }, { status: 500 });
  }
}
