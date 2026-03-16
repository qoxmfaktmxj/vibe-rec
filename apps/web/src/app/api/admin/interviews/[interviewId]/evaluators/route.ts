import { NextResponse } from "next/server";

import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { addInterviewEvaluator } from "@/shared/api/admin-interviews";

interface RouteProps {
  params: Promise<{ interviewId: string }>;
}

export async function POST(request: Request, { params }: RouteProps) {
  const { interviewId } = await params;
  const id = Number(interviewId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: "Invalid interview id." }, { status: 400 });
  }

  try {
    await getRequiredAdminSessionToken();
    const body = (await request.json()) as { evaluatorName: string };
    const interview = await addInterviewEvaluator(id, body.evaluatorName);
    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Failed to add evaluator." }, { status: 500 });
  }
}
