import index from "./index.html";

// The admin server listens ONLY on this port. It is read from the PORT env
// var and defaults to 5174 when unset, so it never collides with the backend
// (3000) or Redis/Grafana (3001).
const port = Number(process.env.PORT ?? 5174);

// Backend base URL. The API is served by the backend on :3000 under /api/v1.
// The admin frontend points BUN_PUBLIC_API_URL at this same server
// (http://localhost:5174/api/v1), so we proxy /api/* requests to the backend.
// This keeps the browser on the same origin (no CORS) and lets the backend
// set/read the HttpOnly refresh cookie across endpoints.
const backendUrl = process.env.ADMIN_BACKEND_URL ?? "http://localhost:3000";

async function proxyApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = `${backendUrl}${url.pathname}${url.search}`;

  // Forward the request body, method and headers upstream, preserving the
  // refresh cookie so the backend can manage sessions across HTTP requests.
  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "follow",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);

  // Build the response back to the browser, passing through Set-Cookie (the
  // refresh token) so the cookie is written on this same origin.
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-security-policy");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

const server = Bun.serve({
  port,
  routes: {
    "/api/*": proxyApi,
    "/*": index,
  },
  development:
    process.env.NODE_ENV !== "production"
      ? { hmr: true, console: true }
      : false,
});

console.log(`🚀 Admin server running at ${server.url}`);
console.log(`   API proxy → ${backendUrl}/api/v1`);
