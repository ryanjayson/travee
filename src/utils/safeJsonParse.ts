/**
 * safeJsonParse — safely parses a JSON string with a fallback value.
 *
 * Prevents unguarded JSON.parse() calls from throwing and crashing callers
 * when stored strings are malformed, partially written, or null/undefined.
 *
 * @param str     The raw JSON string to parse (may be null or undefined).
 * @param fallback The value to return if parsing fails or str is falsy.
 * @returns Parsed value of type T, or `fallback` on any failure.
 *
 * @example
 * const images = safeJsonParse<Images[]>(a.images, []);
 * const coords = safeJsonParse<DestinationDto>(a.destinationData, undefined);
 */
export function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
