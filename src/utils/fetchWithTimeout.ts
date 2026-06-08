/**
 * fetchWithTimeout — wraps the native fetch() with an AbortController timeout.
 *
 * Prevents requests from hanging indefinitely on poor mobile connections.
 * If the request takes longer than `timeoutMs`, it is aborted and an
 * AbortError is thrown.
 *
 * @param url        The URL to fetch.
 * @param options    Standard RequestInit options (headers, method, body, etc.).
 * @param timeoutMs  Maximum time to wait in milliseconds. Default: 15 000ms.
 * @returns          The fetch Response object.
 * @throws           AbortError if the timeout is exceeded, or any other fetch error.
 *
 * @example
 * const response = await fetchWithTimeout(url, { method: "GET", headers }, 10_000);
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15_000
): Promise<Response> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timerId);
  }
}
