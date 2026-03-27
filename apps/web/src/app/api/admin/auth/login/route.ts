import { NextResponse } from "next/server";

import type { AdminLoginPayload } from "@/entities/admin/model";
import { AdminApiError, loginAdmin } from "@/shared/api/admin-auth";
import { ADMIN_SESSION_COOKIE } from "@/shared/lib/admin-auth";
import { buildSessionCookieOptions } from "@/shared/lib/session-cookie";

export async function POST(request: Request) {
  const payload = (await request.json()) as AdminLoginPayload;

  try {
    const response = await loginAdmin(payload);
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
      const message =
        error.status === 401 || error.status === 403
          ? "아이디와 비밀번호를 다시 확인해 주세요."
          : error.message;

      return NextResponse.json({ message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
