import "server-only";

const IP_ADDRESS_PATTERN = /^[0-9a-f:.]+$/i;

function normalizeAddress(value: string | null) {
  if (!value) return null;
  const normalized = value.trim().replace(/^\[|\]$/g, "");
  if (!normalized || normalized.length > 64 || !IP_ADDRESS_PATTERN.test(normalized)) {
    return null;
  }
  return normalized.toLowerCase();
}

export function getClientNetwork(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1) ?? null;
  return normalizeAddress(forwarded) ?? "unknown";
}

export function clientNetworkHeaders(clientNetwork?: string | null): Record<string, string> {
  return { "X-Client-Network": clientNetwork ?? "unknown" };
}
