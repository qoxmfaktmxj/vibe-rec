import { NextResponse } from "next/server";

import type { ApplicationFinalStatus } from "@/entities/recruitment/model";
import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { makeFinalDecision } from "@/shared/api/admin-hiring";

interface RouteProps {
  params: Promise<{ id: string }>;
}

async function handleDecision(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json(
      { message: "유효하지 않은 지원서 ID입니다." },
      { status: 400 },
    );
  }

  try {
    await getRequiredAdminSessionToken();
    const payload = (await request.json()) as {
      finalStatus: ApplicationFinalStatus;
      note?: string | null;
      finalNote?: string | null;
    };

    const decision = await makeFinalDecision(applicationId, {
      finalStatus: payload.finalStatus,
      note: payload.note ?? payload.finalNote ?? undefined,
    });

    return NextResponse.json(decision);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "최종 결정 업데이트에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteProps) {
  return handleDecision(request, context);
}

export async function PUT(request: Request, context: RouteProps) {
  return handleDecision(request, context);
}
