import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/shared/lib/api-config";

const CANDIDATE_SESSION_COOKIE = "vibe_rec_candidate_session";

async function proxyError(response: Response) {
  const body = await response.json().catch(() => ({
    code: "UPSTREAM_ERROR",
    message: "요청을 처리하지 못했습니다.",
  }));
  const requestId = response.headers.get("X-Request-Id");
  return NextResponse.json(body, {
    status: response.status,
    headers: requestId ? { "X-Request-Id": requestId } : undefined,
  });
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CANDIDATE_SESSION_COOKIE)?.value;
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const response = await fetch(`${getApiBaseUrl()}/candidate/profile`, {
    headers: { Accept: "application/json", "X-Candidate-Session": sessionToken },
  });

  if (!response.ok) return proxyError(response);
  const data = await response.json();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CANDIDATE_SESSION_COOKIE)?.value;
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const response = await fetch(`${getApiBaseUrl()}/candidate/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Candidate-Session": sessionToken },
    body: JSON.stringify(body),
  });

  if (!response.ok) return proxyError(response);
  return NextResponse.json(await response.json());
}
