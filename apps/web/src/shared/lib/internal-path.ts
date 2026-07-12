const INTERNAL_ORIGIN = "https://hireflow.invalid";
const UNSAFE_PATH_CHARACTERS = /[\\\u0000-\u001f\u007f]/;

export function resolveInternalPath(value: string | undefined, fallback: string) {
  if (!value?.startsWith("/") || UNSAFE_PATH_CHARACTERS.test(value)) {
    return fallback;
  }

  try {
    const resolved = new URL(value, INTERNAL_ORIGIN);
    if (resolved.origin !== INTERNAL_ORIGIN) {
      return fallback;
    }
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
