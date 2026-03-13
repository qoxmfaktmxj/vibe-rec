import { NextResponse } from "next/server";

import type { SaveApplicationDraftPayload } from "@/entities/recruitment/model";
import { ApiError, saveApplicationDraft } from "@/shared/api/recruitment";

interface SaveApplicationDraftRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: SaveApplicationDraftRouteProps,
) {
  const { id } = await params;
  const jobPostingId = Number(id);

  if (!Number.isInteger(jobPostingId) || jobPostingId <= 0) {
    return NextResponse.json(
      { message: "Invalid job posting id." },
      { status: 400 },
    );
  }

  const payload = (await request.json()) as SaveApplicationDraftPayload;

  try {
    const response = await saveApplicationDraft(jobPostingId, payload);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Failed to save application draft." },
      { status: 500 },
    );
  }
}
