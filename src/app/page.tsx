import db from "@/lib/db";
import SocialFeed from "@/components/feed/SocialFeed";
import HeroSection from "@/components/feed/HeroSection";
import ContextSetter from "@/components/note/ContextSetter";

export default async function HomePage() {
  const [notes, topics, channels] = await Promise.all([
    db.note.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        topic: true,
        author: true,
        comments: true,
      },
    }),
    db.topic.findMany({
      take: 10,
      include: {
        notes: true,
      },
    }),
    db.channel.findMany({
      take: 5,
    }),
  ]);

  // Topics and notes are available if needed for other components
  
  return (
    <div className="w-full">
      <ContextSetter type="HOME" />

      {/* 2. Hero Section */}
      <HeroSection totalNotes={notes.length || 1209} />

      {/* 3. Centered Knowledge Stream Workspace */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 sm:py-12">
        <div className="w-full min-w-0">
          <SocialFeed notes={notes} />
        </div>
      </div>
    </div>
  );
}
