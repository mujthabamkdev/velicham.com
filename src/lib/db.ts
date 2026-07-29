import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  if (envUrl && !envUrl.startsWith("file:./") && !envUrl.startsWith("file:prisma/")) {
    return envUrl;
  }

  // Detect Vercel serverless runtime
  const isServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION
  );

  if (isServerless) {
    const tmpDbPath = path.join("/tmp", "dev.db");

    if (!fs.existsSync(tmpDbPath)) {
      const sourceDb = path.join(process.cwd(), "prisma", "dev.db");
      if (fs.existsSync(sourceDb)) {
        try {
          fs.copyFileSync(sourceDb, tmpDbPath);
          console.log("[DB] Initialized /tmp/dev.db from bundled SQLite seed database");
        } catch (e) {
          console.warn("[DB] Could not copy seed database to /tmp:", e);
        }
      } else {
        try {
          fs.writeFileSync(tmpDbPath, "");
          console.log("[DB] Created new empty SQLite database at /tmp/dev.db");
        } catch (e) {
          console.error("[DB] Could not create /tmp/dev.db:", e);
        }
      }
    }

    return `file:${tmpDbPath}`;
  }

  return envUrl || "file:./dev.db";
}

const dbUrl = getDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;
