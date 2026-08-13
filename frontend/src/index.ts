import { serve } from "bun";
import index from "./index.html";

const server = serve({
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
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" ? { hmr: true, console: true } : false,
});

console.log(`🚀 Server running at ${server.url}`);
