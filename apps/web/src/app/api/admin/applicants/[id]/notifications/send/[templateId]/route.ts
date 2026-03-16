import { NextResponse } from "next/server";

import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { sendNotification } from "@/shared/api/admin-hire";

interface RouteProps {
  params: Promise<{ id: string; templateId: string }>;
}

export async function POST(_request: Request, { params }: RouteProps) {
  const { id, templateId } = await params;
  const applicationId = Number(id);
  const tplId = Number(templateId);
  if (!Number.isInteger(applicationId) || applicationId <= 0 || !Number.isInteger(tplId) || tplId <= 0) {
    return NextResponse.json({ message: "Invalid id." }, { status: 400 });
  }
  try {
    await getRequiredAdminSessionToken();
    const log = await sendNotification(applicationId, tplId);
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Failed to send notification." }, { status: 500 });
  }
}
