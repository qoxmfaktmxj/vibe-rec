import { NextResponse } from "next/server";

import { AdminApiError } from "@/shared/api/admin-auth";
import { replaceAdminScorecardCriteria } from "@/shared/api/admin-job-postings";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> },
) {
  const { id, stepId } = await params;
  const jobPostingId = Number(id);
  const numericStepId = Number(stepId);
  const payload = (await request.json().catch(() => null)) as {
    criteria?: Array<{
      name: string;
      description?: string | null;
      weight: number;
      required: boolean;
    }>;
  } | null;
  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0 || !Number.isInteger(numericStepId) || numericStepId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 공고 단계입니다." }, { status: 400 });
  }
  if (!payload?.criteria?.length || payload.criteria.length > 20) {
    return NextResponse.json({ message: "평가 기준은 1개 이상 20개 이하여야 합니다." }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await replaceAdminScorecardCriteria(jobPostingId, numericStepId, payload.criteria),
    );
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "평가 기준을 저장하지 못했습니다." }, { status: 500 });
  }
}
