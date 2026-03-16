import { NextResponse } from "next/server";

import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { updateInterviewStatus } from "@/shared/api/admin-interviews";

interface RouteProps {
  params: Promise<{ interviewId: string }>;
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const { interviewId } = await params;
  const id = Number(interviewId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: "Invalid interview id." }, { status: 400 });
  }

  try {
    await getRequiredAdminSessionToken();
    const body = (await request.json()) as { status: string };
    const interview = await updateInterviewStatus(id, body.status);
    return NextResponse.json(interview);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Failed to update interview status." }, { status: 500 });
  }
}
