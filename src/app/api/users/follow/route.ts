import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ followedUserIds: [], currentUserId: null });
    }

    const follows = await db.follow.findMany({
      where: { followerId: session.id },
      select: { followingId: true },
    });

    return NextResponse.json({
      followedUserIds: follows.map((f) => f.followingId),
      currentUserId: session.id,
    });
  } catch (error: any) {
    return NextResponse.json({ followedUserIds: [], currentUserId: null });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to follow users" }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    if (targetUserId === session.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.id,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      // Unfollow
      await db.follow.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ following: false, message: "Unfollowed successfully" });
    } else {
      // Follow
      await db.follow.create({
        data: {
          followerId: session.id,
          followingId: targetUserId,
        },
      });
      return NextResponse.json({ following: true, message: "Followed successfully" });
    }
  } catch (error: any) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
