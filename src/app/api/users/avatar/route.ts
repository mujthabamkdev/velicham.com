import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { avatar } = body;

    if (!avatar || typeof avatar !== "string") {
      return NextResponse.json({ error: "Avatar URL is required" }, { status: 400 });
    }

    // Direct SQL update to ensure immediate execution regardless of Prisma Client cache
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "avatar" = ? WHERE "id" = ? OR "email" = ?`,
        avatar,
        session.id,
        session.email
      );
    } catch (sqlErr) {
      // Fallback if avatar column needed adding in dev.db
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "avatar" TEXT`);
      } catch (alterErr) {
        // Column may already exist
      }
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "avatar" = ? WHERE "id" = ? OR "email" = ?`,
        avatar,
        session.id,
        session.email
      );
    }

    return NextResponse.json({ success: true, avatar });
  } catch (error: any) {
    console.error("Failed to update avatar:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update avatar" },
      { status: 500 }
    );
  }
}
