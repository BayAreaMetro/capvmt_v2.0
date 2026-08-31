/**
 * Fetches a path served by this app's own Route Handlers (app/api/*) -
 * always same-origin, so no CORS setup is needed anywhere (see the
 * design doc's "External API consumption" decision).
 */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed: ${path} (${response.status})`);
  }
  return response.json() as Promise<T>;
}
