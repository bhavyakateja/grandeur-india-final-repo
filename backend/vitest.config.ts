import { defineConfig } from "vitest/config";
import { config } from "dotenv";

config({
  path: ".env.test",
});

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
  },
});