import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, ensureAdminUserExists, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Ensure User table exists
    await ensureAdminUserExists();

    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    if (cleanPassword.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters long" },
        { status: 400 }
      );
    }

    // Check existing user via raw SQL for serverless resilience
    let existingUser: any = null;
    try {
      const userRows: any[] = await db.$queryRawUnsafe(
        `SELECT id FROM "User" WHERE email = ? LIMIT 1`,
        normalizedEmail
      );
      if (userRows && userRows.length > 0) {
        existingUser = userRows[0];
      }
    } catch (sqlErr) {
      existingUser = await db.user.findUnique({
        where: { email: normalizedEmail },
      });
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password & create user
    const hashedPassword = await hashPassword(cleanPassword);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userName = name ? String(name).trim() : "User";

    try {
      await db.$executeRawUnsafe(
        `INSERT INTO "User" (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
        userId,
        userName,
        normalizedEmail,
        hashedPassword,
        "USER"
      );
    } catch (sqlInsertErr) {
      console.warn("[SIGNUP] Raw SQL insert fallback:", sqlInsertErr);
      await (db.user as any).create({
        data: {
          id: userId,
          name: userName,
          email: normalizedEmail,
          password: hashedPassword,
          role: "USER",
        },
      });
    }

    const sessionUser = {
      id: userId,
      name: userName,
      email: normalizedEmail,
      role: "USER" as const,
    };

    const token = await createSessionToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
