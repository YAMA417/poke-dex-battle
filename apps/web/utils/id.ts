/**
 * Generates a unique ID prefix from the title by converting to lowercase and replacing non-alphanumeric chars.
 * If the result is empty (e.g. only non-alphanumeric chars were present), uses the fallback key.
 */
export function generateIdPrefix(title: string, fallback?: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);

  if (sanitized.length < 3 && fallback) {
    return fallback;
  }

  return sanitized;
}
