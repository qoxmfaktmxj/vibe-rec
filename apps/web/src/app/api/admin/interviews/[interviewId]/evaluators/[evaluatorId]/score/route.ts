import { NextResponse } from "next/server";

import type { SubmitEvaluationPayload } from "@/entities/admin/interview-model";
import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { submitEvaluation } from "@/shared/api/admin-interviews";

interface RouteProps {
  params: Promise<{ interviewId: string; evaluatorId: string }>;
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const { interviewId, evaluatorId } = await params;
  const iid = Number(interviewId);
  const eid = Number(evaluatorId);

  if (!Number.isInteger(iid) || iid <= 0 || !Number.isInteger(eid) || eid <= 0) {
    return NextResponse.json({ message: "Invalid id." }, { status: 400 });
  }

  try {
    await getRequiredAdminSessionToken();
    const payload = (await request.json()) as SubmitEvaluationPayload;
    const interview = await submitEvaluation(iid, eid, payload);
    return NextResponse.json(interview);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Failed to submit evaluation." }, { status: 500 });
  }
}
