import { NextResponse } from "next/server";

import type { EvaluationResult } from "@/entities/recruitment/model";
import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { createEvaluation } from "@/shared/api/admin-interviews";

interface RouteProps {
  params: Promise<{ id: string; interviewId: string }>;
}

export async function POST(request: Request, { params }: RouteProps) {
  const { interviewId } = await params;
  const id = Number(interviewId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { message: "유효하지 않은 면접 ID입니다." },
      { status: 400 },
    );
  }

  try {
    await getRequiredAdminSessionToken();
    const payload = (await request.json()) as {
      score: number | null;
      comment?: string | null;
      result: EvaluationResult;
    };
    const evaluation = await createEvaluation(id, {
      score: payload.score,
      comment: payload.comment ?? null,
      result: payload.result,
    });
    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "평가 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
