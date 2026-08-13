import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createLogger } from "../modules/logger";

const databaseLogger = createLogger({ component: "database" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

pool.on("error", (error) => {
  databaseLogger.error({ error }, "PostgreSQL pool error");
});

const adapter = new PrismaPg(pool);

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
