import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || session.id;

    // 1. Get follower count for target user
    const countResult = await db.follow.count({
      where: { followingId: targetUserId },
    });

    // 2. Restricted: Only logged-in user can view their OWN list of followers
    let followersList: any[] = [];
    if (targetUserId === session.id) {
      try {
        // Query followers with user details
        const follows = await db.follow.findMany({
          where: { followingId: session.id },
          orderBy: { createdAt: "desc" },
        });

        const followerUserIds = follows.map((f) => f.followerId);

        if (followerUserIds.length > 0) {
          // Direct SQL to safely retrieve follower details including avatar
          const sqlRows: any[] = await prisma.$queryRawUnsafe(
            `SELECT id, name, email, avatar FROM "User" WHERE id IN (${followerUserIds.map(() => "?").join(",")})`,
            ...followerUserIds
          );
          followersList = sqlRows;
        }
      } catch (sqlErr) {
        console.warn("Followers list SQL query warning:", sqlErr);
      }
    }

    return NextResponse.json({
      success: true,
      followerCount: countResult,
      followers: followersList,
    });
  } catch (error: any) {
    console.error("Failed to fetch followers:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
