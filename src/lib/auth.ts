import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "velicham-super-secret-key-2026-secure-jwt"
);

export const AUTH_COOKIE_NAME = "velicham_session";

export interface UserSession {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
}

// Hash password using bcryptjs
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Verify plain password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Create JWT Session Token
export async function createSessionToken(user: UserSession): Promise<string> {
  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// Verify JWT Session Token
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload;
    return {
      id: payload.id as string,
      name: (payload.name as string) || null,
      email: payload.email as string,
      role: (payload.role as "USER" | "ADMIN") || "USER",
    };
  } catch (error) {
    return null;
  }
}

// Get Session User from HTTP-only Cookies
export async function getSessionUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch (e) {
    return null;
  }
}

// Automatically ensure default User table and Admin user exist in DB
export async function ensureAdminUserExists() {
  try {
    // 1. Auto-create User table if missing in SQLite file
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT,
        "avatar" TEXT,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "openRouterApiKey" TEXT,
        "galaxyConfig" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const adminEmail = "admin@velicham.com";
    const existingAdminRows: any[] = await db.$queryRawUnsafe(
      `SELECT id FROM "User" WHERE email = ? LIMIT 1`,
      adminEmail
    );

    if (!existingAdminRows || existingAdminRows.length === 0) {
      const hashedPassword = await hashPassword("admin123");
      const adminId = `admin-${Date.now()}`;
      await db.$executeRawUnsafe(
        `INSERT INTO "User" (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
        adminId,
        "System Admin",
        adminEmail,
        hashedPassword,
        "ADMIN"
      );
      console.log("[AUTH] Default Admin account created: admin@velicham.com");
    }
  } catch (e) {
    console.error("[AUTH] Failed to ensure default admin account:", e);
  }
}
