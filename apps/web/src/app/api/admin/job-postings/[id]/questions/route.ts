import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/shared/lib/admin-auth";

function getApiBaseUrl() {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8081/api"
  ).replace(/\/$/, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const response = await fetch(`${getApiBaseUrl()}/job-postings/${id}/questions`, {
    headers: { Accept: "application/json", "X-Admin-Session": sessionToken },
  });

  if (!response.ok) return NextResponse.json({ error: "Failed" }, { status: response.status });
  const data = await response.json();
  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const response = await fetch(`${getApiBaseUrl()}/admin/job-postings/${id}/questions`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Session": sessionToken,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) return NextResponse.json({ error: "Failed" }, { status: response.status });
  return NextResponse.json({ ok: true });
}
