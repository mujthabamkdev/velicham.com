import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSessionToken, ensureAdminUserExists, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Ensure default admin account and User table exist
    await ensureAdminUserExists();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // Find user in DB via raw SQL for maximum resilience on serverless instances
    let user: any = null;
    try {
      const userRows: any[] = await db.$queryRawUnsafe(
        `SELECT id, name, email, password, role FROM "User" WHERE email = ? LIMIT 1`,
        normalizedEmail
      );
      if (userRows && userRows.length > 0) {
        user = userRows[0];
      }
    } catch (sqlErr) {
      console.warn("[LOGIN] Raw SQL fallback query:", sqlErr);
      user = await db.user.findUnique({
        where: { email: normalizedEmail },
      });
    }

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify bcrypt password hash
    const isValid = await verifyPassword(cleanPassword, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
