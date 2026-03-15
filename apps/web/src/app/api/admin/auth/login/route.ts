import { NextResponse } from "next/server";

import type { AdminLoginPayload } from "@/entities/admin/model";
import { AdminApiError, loginAdmin } from "@/shared/api/admin-auth";
import { ADMIN_SESSION_COOKIE } from "@/shared/lib/admin-auth";

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

    nextResponse.cookies.set(ADMIN_SESSION_COOKIE, response.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(response.expiresAt),
    });

    return nextResponse;
  } catch (error) {
    if (error instanceof AdminApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Failed to sign in." },
      { status: 500 },
    );
  }
}
