import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logoutAdmin } from "@/shared/api/admin-auth";
import { ADMIN_SESSION_COOKIE } from "@/shared/lib/admin-auth";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (sessionToken) {
    try {
      await logoutAdmin(sessionToken);
    } catch {
      // Clear the local cookie even when backend session cleanup fails.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}
