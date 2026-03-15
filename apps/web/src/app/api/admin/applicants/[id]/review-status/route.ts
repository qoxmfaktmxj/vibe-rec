import { NextResponse } from "next/server";

import type { UpdateApplicantReviewStatusPayload } from "@/entities/admin/applicant-model";
import {
  AdminApiError,
  getRequiredAdminSessionToken,
} from "@/shared/api/admin-auth";
import { updateAdminApplicantReviewStatus } from "@/shared/api/admin-applicants";

interface UpdateApplicantReviewStatusRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  { params }: UpdateApplicantReviewStatusRouteProps,
) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return NextResponse.json(
      { message: "Invalid application id." },
      { status: 400 },
    );
  }

  try {
    await getRequiredAdminSessionToken();
    const payload = (await request.json()) as UpdateApplicantReviewStatusPayload;
    const response = await updateAdminApplicantReviewStatus(applicationId, payload);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Failed to update applicant review status." },
      { status: 500 },
    );
  }
}
