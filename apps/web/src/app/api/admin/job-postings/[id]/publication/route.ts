import { NextResponse } from "next/server";

import { AdminApiError } from "@/shared/api/admin-auth";
import { scheduleAdminJobPostingPublication } from "@/shared/api/admin-job-postings";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const jobPostingId = Number((await params).id);
  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 공고 ID입니다." }, { status: 400 });
  }
  try {
    const payload = (await request.json()) as { publishAt?: string };
    if (!payload.publishAt || Number.isNaN(new Date(payload.publishAt).getTime())) {
      return NextResponse.json({ message: "공개 시각을 입력해 주세요." }, { status: 400 });
    }
    return NextResponse.json(
      await scheduleAdminJobPostingPublication(jobPostingId, payload.publishAt),
    );
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "공개 일정을 변경하지 못했습니다." }, { status: 500 });
  }
}
