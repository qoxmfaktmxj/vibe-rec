import { NextResponse } from "next/server";

import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { getNotificationHistory } from "@/shared/api/admin-hire";

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
    const logs = await getNotificationHistory(applicationId);
    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Failed to fetch notification history." }, { status: 500 });
  }
}
