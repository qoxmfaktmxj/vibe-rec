import { NextResponse } from "next/server";

import { AdminApiError } from "@/shared/api/admin-auth";
import { cloneAdminJobPosting } from "@/shared/api/admin-job-postings";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const jobPostingId = Number((await params).id);
  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 공고 ID입니다." }, { status: 400 });
  }
  try {
    return NextResponse.json(await cloneAdminJobPosting(jobPostingId), { status: 201 });
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "공고를 복제하지 못했습니다." }, { status: 500 });
  }
}
