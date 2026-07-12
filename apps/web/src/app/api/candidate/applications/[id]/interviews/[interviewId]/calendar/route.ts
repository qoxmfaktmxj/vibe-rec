import { NextResponse } from "next/server";

import {
  CandidateApiError,
  getRequiredCandidateSessionToken,
} from "@/shared/api/candidate-auth";
import { getApiBaseUrl } from "@/shared/api/admin-auth";

interface RouteProps {
  params: Promise<{ id: string; interviewId: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { id, interviewId } = await params;
  const applicationId = Number(id);
  const numericInterviewId = Number(interviewId);
  if (
    !Number.isInteger(applicationId) ||
    applicationId <= 0 ||
    !Number.isInteger(numericInterviewId) ||
    numericInterviewId <= 0
  ) {
    return NextResponse.json({ message: "유효하지 않은 면접 일정입니다." }, { status: 400 });
  }

  try {
    const sessionToken = await getRequiredCandidateSessionToken();
    const upstream = await fetch(
      `${getApiBaseUrl()}/candidate/applications/${applicationId}/interviews/${numericInterviewId}/calendar`,
      {
        cache: "no-store",
        headers: { "X-Candidate-Session": sessionToken },
      },
    );
    if (!upstream.ok) {
      return NextResponse.json(
        { message: "면접 일정을 내려받지 못했습니다." },
        { status: upstream.status },
      );
    }

    return new NextResponse(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "text/calendar; charset=UTF-8",
        "Content-Disposition": upstream.headers.get("content-disposition") ?? `attachment; filename="vibe-rec-interview-${numericInterviewId}.ics"`,
      },
    });
  } catch (error) {
    if (error instanceof CandidateApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { message: "면접 일정을 내려받지 못했습니다." },
      { status: 500 },
    );
  }
}
