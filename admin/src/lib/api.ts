const API_BASE_URL = (
  process.env.BUN_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1"
).replace(/\/$/, "");

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) { accessToken = token; }
export function getAccessToken() { return accessToken; }

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return response.json();
  if (type.startsWith("text/")) return response.text();
  return undefined;
}

function messageFor(status: number, data: unknown) {
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") return data.message;
  const messages: Record<number, string> = {
    400: "The request is invalid.",
    401: "Your administrator session has expired.",
    403: "You are not authorized to perform this action.",
    404: "The requested resource was not found.",
    409: "This operation conflicts with existing data.",
    422: "Some submitted data is invalid.",
    429: "Too many requests. Please try again later.",
  };
  return messages[status] ?? (status >= 500 ? "The server could not complete the request." : `Request failed (${status}).`);
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = await parseBody(response) as { accessToken?: string } | undefined;
      if (!response.ok || !data?.accessToken) {
        accessToken = null;
        return null;
      }
      accessToken = data.accessToken;
      return accessToken;
    } catch {
      accessToken = null;
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOn401 = true,
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response = await fetch(url, { ...options, headers, credentials: "include" });

  if (response.status === 401 && retryOn401 && !endpoint.startsWith("/auth/")) {
    const token = await refreshAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      response = await fetch(url, { ...options, headers, credentials: "include" });
    }
  }

  const data = await parseBody(response);
  if (!response.ok) throw new ApiError(messageFor(response.status, data), response.status, data);
  return data as T;
}

export async function uploadFile<T>(file: File, folder: "products" | "reviews" | "avatars"): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  return apiRequest<T>("/upload", { method: "POST", body: form });
}
