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
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <ContextSetter type="HOME" />

      {/* Hero — Interactive Galaxy Canvas (Clean view without blocking center text) */}
      <section className="h-[60vh] sm:h-[65vh] relative w-full overflow-hidden border-b border-white/10">
        <GalaxyWrapper nebulas={[]} />
      </section>

      {/* Social Feed — X-style Posts Stream */}
      <section className="max-w-5xl mx-auto px-4 py-12 w-full space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Knowledge Feed
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Interactive shorts connected by AI
            </p>
          </div>
        </div>

        <SocialFeed notes={notes} />
      </section>
    </div>
  );
}
