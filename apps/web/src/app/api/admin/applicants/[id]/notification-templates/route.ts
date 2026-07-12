import { NextResponse } from "next/server";

import { AdminApiError } from "@/shared/api/admin-auth";
import { getNotificationTemplates } from "@/shared/api/admin-hiring";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const applicationId = Number((await params).id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json({ message: "유효하지 않은 지원서 ID입니다." }, { status: 400 });
  }

  try {
    return NextResponse.json(await getNotificationTemplates(applicationId));
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "통지 템플릿을 불러오지 못했습니다." }, { status: 500 });
  }
}
