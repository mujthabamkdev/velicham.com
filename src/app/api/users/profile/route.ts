import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "name" = ? WHERE "id" = ? OR "email" = ?`,
        trimmedName,
        session.id,
        session.email
      );
    } catch (sqlErr) {
      console.error("Direct SQL update name failed:", sqlErr);
      return NextResponse.json({ error: "Failed to update profile name" }, { status: 500 });
    }

    return NextResponse.json({ success: true, name: trimmedName });
  } catch (error: any) {
    console.error("Failed to update profile name:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update profile name" },
      { status: 500 }
    );
  }
}
