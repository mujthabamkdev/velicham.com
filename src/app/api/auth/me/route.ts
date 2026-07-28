import { NextResponse } from "next/server";
import { getSessionUser, ensureAdminUserExists } from "@/lib/auth";

export async function GET() {
  try {
    await ensureAdminUserExists();
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
