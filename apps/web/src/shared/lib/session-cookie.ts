import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

function isSecureRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export function buildSessionCookieOptions(
  request: Request,
  expiresAt: string,
): Pick<ResponseCookie, "httpOnly" | "sameSite" | "secure" | "path" | "expires"> {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    expires: new Date(expiresAt),
  };
}
