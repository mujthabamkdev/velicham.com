import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ notes: [] }, { status: 401 });
    }

    const notes = await db.note.findMany({
      where: { userCreatorId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        topic: true,
        author: true,
        userCreator: true,
        comments: true,
      },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Failed to fetch user notes:", error);
    return NextResponse.json({ notes: [] }, { status: 500 });
  }
}
