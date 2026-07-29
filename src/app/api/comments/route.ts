import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { moderateComment } from "@/lib/ai/gemini";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to comment." }, { status: 401 });
    }

    const body = await req.json();
    const { noteId, content } = body;

    if (!noteId || !content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    const note = await db.note.findUnique({ where: { id: noteId } });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // AI Moderation check
    let status = "APPROVED";
    let aiReply = null;
    try {
      const moderation = await moderateComment(content.trim());
      status = moderation.status;
      aiReply = moderation.aiReply || null;
    } catch (e) {
      console.warn("Comment moderation fallback:", e);
    }

    // Create comment record
    const createdComment = await db.comment.create({
      data: {
        noteId,
        userId: session.id,
        content: content.trim(),
        status,
        aiReply,
      },
    });

    // Fetch user details safely via raw SQL to bypass in-memory Prisma DTO cache
    let userAvatar = null;
    let userName = session.name;
    try {
      const userRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT name, avatar FROM "User" WHERE id = ? OR email = ? LIMIT 1`,
        session.id,
        session.email
      );
      if (userRows && userRows.length > 0) {
        userAvatar = userRows[0].avatar;
        if (userRows[0].name) userName = userRows[0].name;
      }
    } catch (sqlErr) {
      console.warn("Raw SQL user avatar fetch warning:", sqlErr);
    }

    const commentPayload = {
      ...createdComment,
      user: {
        id: session.id,
        name: userName,
        email: session.email,
        avatar: userAvatar,
        role: session.role,
      },
    };

    return NextResponse.json({ success: true, comment: commentPayload });
  } catch (error: any) {
    console.error("Failed to post comment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to post comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    const comment = await db.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isOwner = comment.userId === session.id;
    const isAdmin = session.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden. You can only delete your own comments." }, { status: 403 });
    }

    await db.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true, deletedId: commentId });
  } catch (error: any) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete comment" },
      { status: 500 }
    );
  }
}
