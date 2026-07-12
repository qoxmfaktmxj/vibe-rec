import { NextResponse } from "next/server";

import {
  CandidateApiError,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import { ApiError, markCandidateNotificationRead } from "@/shared/api/recruitment";

interface NotificationReadRouteProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, { params }: NotificationReadRouteProps) {
  const notificationId = Number((await params).id);
  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 알림 ID입니다." }, { status: 400 });
  }

  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    return NextResponse.json(
      await markCandidateNotificationRead(notificationId, sessionToken),
    );
  } catch (error) {
    if (error instanceof CandidateApiError || error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "알림을 읽음 처리하지 못했습니다." }, { status: 500 });
  }
}
