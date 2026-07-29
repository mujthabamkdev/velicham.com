import { NextResponse } from "next/server";
import { getSessionUser, ensureAdminUserExists } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    await ensureAdminUserExists();
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, name, email, avatar, role FROM "User" WHERE id = ? OR email = ? LIMIT 1`,
        session.id,
        session.email
      );

      if (rows && rows.length > 0) {
        return NextResponse.json({ user: rows[0] });
      }
    } catch (rawErr) {
      console.warn("Raw SQL query failed, falling back to session:", rawErr);
    }

    return NextResponse.json({ user: session });
  } catch (error) {
    console.error("Auth session check error:", error);
    return NextResponse.json({ user: null });
  }
}
