import db from "@/lib/db";
import SocialFeed from "@/components/feed/SocialFeed";
import GalaxyWrapper from "@/components/galaxy/GalaxyWrapper";
import ContextSetter from "@/components/note/ContextSetter";

export default async function HomePage() {
  const notes = await db.note.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      topic: true,
      author: true,
      comments: true,
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-[--color-void]">
      <ContextSetter type="HOME" />

      {/* Hero — 3D Galaxy Canvas (Unobstructed full view with overlay controls) */}
      <section className="h-[55vh] sm:h-[62vh] relative w-full overflow-hidden border-b border-white/10">
        <GalaxyWrapper nebulas={[]} />
      </section>

      {/* Centered Knowledge Feed (X.com Timeline Stream) */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Knowledge Stream
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              AI-connected shorts · X.com timeline
            </p>
          </div>
        </div>

        <SocialFeed notes={notes} />
      </section>
    </div>
  );
}
