import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptText, decryptText, maskApiKey } from "@/lib/encryption";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user: any = await (db.user as any).findUnique({
      where: { id: session.id },
      select: { openRouterApiKey: true },
    });

    if (!user || !user.openRouterApiKey) {
      return NextResponse.json({ hasKey: false, maskedKey: null });
    }

    const decrypted = decryptText(user.openRouterApiKey);
    if (!decrypted) {
      return NextResponse.json({ hasKey: false, maskedKey: null });
    }

    return NextResponse.json({
      hasKey: true,
      maskedKey: maskApiKey(decrypted),
    });
  } catch (error: any) {
    console.error("GET openrouter-key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim().startsWith("sk-or-v1-")) {
      return NextResponse.json(
        { error: "Invalid OpenRouter API Key format. Keys must start with 'sk-or-v1-'" },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();
    const encryptedKey = encryptText(trimmedKey);

    await (db.user as any).update({
      where: { id: session.id },
      data: { openRouterApiKey: encryptedKey },
    });

    return NextResponse.json({
      success: true,
      hasKey: true,
      maskedKey: maskApiKey(trimmedKey),
    });
  } catch (error: any) {
    console.error("POST openrouter-key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await (db.user as any).update({
      where: { id: session.id },
      data: { openRouterApiKey: null },
    });

    return NextResponse.json({ success: true, hasKey: false, maskedKey: null });
  } catch (error: any) {
    console.error("DELETE openrouter-key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
