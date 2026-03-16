import { NextResponse } from "next/server";

import type { CreateHireDecisionPayload } from "@/entities/admin/hire-model";
import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { createHireDecision, getHireDecision } from "@/shared/api/admin-hire";

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
    const decision = await getHireDecision(applicationId);
    return NextResponse.json(decision ?? null);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Failed to fetch hire decision." }, { status: 500 });
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
    const payload = (await request.json()) as CreateHireDecisionPayload;
    const decision = await createHireDecision(applicationId, payload);
    return NextResponse.json(decision, { status: 201 });
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Failed to create hire decision." }, { status: 500 });
  }
}
