import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logoutCandidate } from "@/shared/api/candidate-auth";
import { CANDIDATE_SESSION_COOKIE } from "@/shared/lib/candidate-auth";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CANDIDATE_SESSION_COOKIE)?.value;

  if (sessionToken) {
    try {
      await logoutCandidate(sessionToken);
    } catch {
      // clear cookie regardless
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(CANDIDATE_SESSION_COOKIE);
  return response;
}