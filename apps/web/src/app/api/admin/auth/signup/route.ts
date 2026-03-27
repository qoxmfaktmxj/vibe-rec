import { NextResponse } from "next/server";

import type { AdminSignupPayload } from "@/entities/admin/model";
import { AdminApiError, signupAdmin } from "@/shared/api/admin-auth";
import { ADMIN_SESSION_COOKIE } from "@/shared/lib/admin-auth";
import { buildSessionCookieOptions } from "@/shared/lib/session-cookie";

export async function POST(request: Request) {
  const payload = (await request.json()) as AdminSignupPayload;

  try {
    const response = await signupAdmin(payload);
    const nextResponse = NextResponse.json({
      adminAccountId: response.adminAccountId,
      username: response.username,
      displayName: response.displayName,
      role: response.role,
      authenticatedAt: response.authenticatedAt,
      expiresAt: response.expiresAt,
    });

    nextResponse.cookies.set(
      ADMIN_SESSION_COOKIE,
      response.sessionToken,
      buildSessionCookieOptions(request, response.expiresAt),
    );

    return nextResponse;
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
