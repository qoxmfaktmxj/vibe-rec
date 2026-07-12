import { NextResponse } from "next/server";

import { AdminApiError } from "@/shared/api/admin-auth";
import { retryNotification } from "@/shared/api/admin-hiring";

interface RouteProps {
  params: Promise<{ id: string; notificationId: string }>;
}

export async function POST(_request: Request, { params }: RouteProps) {
  const { id, notificationId: notificationIdParam } = await params;
  const applicationId = Number(id);
  const notificationId = Number(notificationIdParam);
  if (!Number.isInteger(applicationId) || applicationId <= 0 || !Number.isInteger(notificationId) || notificationId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 통지 요청입니다." }, { status: 400 });
  }

  try {
    return NextResponse.json(await retryNotification(applicationId, notificationId));
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "통지를 재시도하지 못했습니다." }, { status: 500 });
  }
}
