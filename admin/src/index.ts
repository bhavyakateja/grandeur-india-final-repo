import index from "./index.html";

const server = Bun.serve({
  routes: { "/*": index },
  ...(process.env.NODE_ENV !== "production"
    ? { development: { hmr: true, console: true } }
    : {}),
});

console.log(`🚀 Admin server running at ${server.url}`);
