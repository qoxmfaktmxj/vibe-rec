import { NextResponse } from "next/server";

import type { InterviewStatus } from "@/entities/recruitment/model";
import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { updateInterviewStatus } from "@/shared/api/admin-interviews";

interface RouteProps {
  params: Promise<{ id: string; interviewId: string }>;
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const { interviewId } = await params;
  const id = Number(interviewId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { message: "유효하지 않은 면접 ID입니다." },
      { status: 400 },
    );
  }

  try {
    await getRequiredAdminSessionToken();
    const body = (await request.json()) as { status: InterviewStatus };
    const interview = await updateInterviewStatus(id, body.status);
    return NextResponse.json(interview);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "면접 상태 변경에 실패했습니다." },
      { status: 500 },
    );
  }
}
