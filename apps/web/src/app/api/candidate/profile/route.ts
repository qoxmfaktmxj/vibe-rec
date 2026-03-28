import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/shared/lib/api-config";

const CANDIDATE_SESSION_COOKIE = "vibe_rec_candidate_session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CANDIDATE_SESSION_COOKIE)?.value;
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const response = await fetch(`${getApiBaseUrl()}/candidate/profile`, {
    headers: { Accept: "application/json", "X-Candidate-Session": sessionToken },
  });

  if (!response.ok) return NextResponse.json({ error: "Failed" }, { status: response.status });
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

  if (!response.ok) return NextResponse.json({ error: "Failed" }, { status: response.status });
  return NextResponse.json({ ok: true });
}
