import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaPragmaSet?: boolean };

const isNewClient = !globalForPrisma.prisma;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// SQLite serializes writes at the file level; WAL + a busy timeout let
// concurrent requests (multiple checklist answers submitted in quick
// succession) queue instead of failing with "database is locked".
if (isNewClient && !globalForPrisma.prismaPragmaSet) {
  globalForPrisma.prismaPragmaSet = true;
  db.$queryRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {});
  db.$queryRawUnsafe("PRAGMA busy_timeout=5000;").catch(() => {});
}
