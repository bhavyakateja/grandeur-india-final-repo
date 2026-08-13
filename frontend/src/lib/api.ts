const API_BASE_URL = (
  typeof process !== "undefined" &&
  process.env &&
  typeof process.env.BUN_PUBLIC_API_URL === "string"
    ? process.env.BUN_PUBLIC_API_URL
    : "http://localhost:3000/api/v1"
).replace(/\/$/, "");


let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) { accessToken = token; }
export function getAccessToken() { return accessToken; }
export function getApiBaseUrl() { return API_BASE_URL; }

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message); this.name = "ApiError"; this.status = status; this.data = data;
  }
}

function messageFor(status: number, data: unknown) {
  if (data && typeof data === "object") {
    if ("message" in data && typeof data.message === "string") return data.message;
    if ("error" in data && typeof data.error === "string") return data.error;
    if ("errors" in data && Array.isArray(data.errors)) {
      const first = data.errors.find((item) => typeof item === "string");
      if (first) return first;
      const message = data.errors.find((item) => item && typeof item === "object" && "message" in item && typeof item.message === "string");
      if (message && typeof message === "object" && "message" in message) return String(message.message);
    }
  }
  if (status === 400) return "The request could not be completed.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You are not authorized to perform this action.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 409) return "This operation conflicts with existing data.";
  if (status === 422) return "Some submitted information is invalid.";
  if (status === 429) return "Too many requests. Please try again later.";
  if (status >= 500) return "Something went wrong on the server.";
  return "Request failed.";
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    try { return await response.json(); } catch { return undefined; }
  }
  try { return await response.text(); } catch { return undefined; }
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST", credentials: "include", headers: { Accept: "application/json" },
      });
      if (!response.ok) { accessToken = null; return null; }
      const data = await response.json() as { accessToken?: string };
      accessToken = data.accessToken ?? null;
      return accessToken;
    } catch { accessToken = null; return null; }
    finally { refreshPromise = null; }
  })();
  return refreshPromise;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}, retryAfterRefresh = true): Promise<T> {
  const path = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(path, { ...options, headers, credentials: "include" });
  if (response.status === 401 && retryAfterRefresh && !["/auth/login", "/auth/signup", "/auth/refresh", "/auth/logout"].some((path) => endpoint.startsWith(path))) {
    const token = await refreshAccessToken();
    if (token) return apiRequest<T>(endpoint, options, false);
  }
  const data = await readBody(response);
  if (!response.ok) throw new ApiError(messageFor(response.status, data), response.status, data);
  return data as T;
}

export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
    method: "POST", body: formData, headers, credentials: "include",
  });
  const data = await readBody(response);
  if (!response.ok) throw new ApiError(messageFor(response.status, data), response.status, data);
  return data as T;
}


export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const obj = value as Record<string, unknown>;

  if (Array.isArray(obj.data)) {
    return obj.data as T[];
  }

  if (Array.isArray(obj.items)) {
    return obj.items as T[];
  }

  if (Array.isArray(obj.results)) {
    return obj.results as T[];
  }

  if (Array.isArray(obj.categories)) {
    return obj.categories as T[];
  }

  if (Array.isArray(obj.products)) {
    return obj.products as T[];
  }

  if (Array.isArray(obj.wishlist)) {
    return obj.wishlist as T[];
  }

  return [];
}