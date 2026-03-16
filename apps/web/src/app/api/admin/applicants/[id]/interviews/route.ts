import { NextResponse } from "next/server";

import type { ScheduleInterviewPayload } from "@/entities/admin/interview-model";
import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import {
  getAdminInterviews,
  scheduleInterview,
} from "@/shared/api/admin-interviews";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json({ message: "Invalid application id." }, { status: 400 });
  }

  try {
    await getRequiredAdminSessionToken();
    const interviews = await getAdminInterviews(applicationId);
    return NextResponse.json(interviews);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Failed to fetch interviews." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json({ message: "Invalid application id." }, { status: 400 });
  }

  try {
    await getRequiredAdminSessionToken();
    const payload = (await request.json()) as ScheduleInterviewPayload;
    const interview = await scheduleInterview(applicationId, payload);
    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Failed to schedule interview." }, { status: 500 });
  }
}
