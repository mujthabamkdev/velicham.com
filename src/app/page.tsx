import db from "@/lib/db";
import SocialFeed from "@/components/feed/SocialFeed";
import ContextSetter from "@/components/note/ContextSetter";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let notes: any[] = [];

  try {
    notes = await db.note.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        topic: true,
        author: true,
        userCreator: true,
        comments: true,
      },
    });
  } catch (err) {
    console.error("Home page DB fetch error:", err);
  }

  return (
    <div className="w-full">
      <ContextSetter type="HOME" />

      {/* Centered Knowledge Stream Workspace */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 sm:py-12">
        <div className="w-full min-w-0">
          <SocialFeed notes={notes} />
        </div>
      </div>
    </div>
  );
}
