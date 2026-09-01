import { prisma } from "../../db/prisma";

export async function checkPostgreSql(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}