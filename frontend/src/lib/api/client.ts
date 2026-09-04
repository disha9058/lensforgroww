/**
 * Thin HTTP client for the FastAPI backend.
 */
export const API_BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ??
  "http://127.0.0.1:8000";

export const USE_MOCK = false;

/** Temporary single-user id until auth exists. */
export const USER_ID = "33e63b17-db00-4a9a-a789-beeed6c89aff";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}
