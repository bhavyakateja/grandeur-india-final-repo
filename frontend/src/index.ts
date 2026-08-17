import { serve } from "bun";
import index from "./index.html";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";

async function proxyApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = `${backendUrl}${url.pathname}${url.search}`;

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

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-security-policy");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

const server = serve({
  port: 5175,
  routes: {
    "/videos/hero.mp4": {
      GET() {
        return new Response(Bun.file("./public/videos/hero.mp4"), {
          headers: {
            "Content-Type": "video/mp4",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
    "/api/*": proxyApi,
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" ? { hmr: true, console: true } : false,
});

console.log(`🚀 Server running at ${server.url}`);
