import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ notes: [] });
    }

    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ notes: [] });
    }

    const notes = await db.note.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        topic: true,
        author: true,
        userCreator: true,
        comments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error("Failed to fetch saved notes:", error);
    return NextResponse.json({ error: "Failed to fetch saved notes" }, { status: 500 });
  }
}
