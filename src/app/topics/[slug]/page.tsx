import db from "@/lib/db";
import { notFound } from "next/navigation";
import SocialFeed from "@/components/feed/SocialFeed";
import ContextSetter from "@/components/note/ContextSetter";

export const dynamic = "force-dynamic";

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let topic: any = null;
  try {
    topic = await db.topic.findUnique({
      where: { slug },
      include: {
        notes: {
          include: { topic: true, author: true, userCreator: true, comments: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (err) {
    console.error("Topic page fetch error:", err);
  }

  if (!topic) notFound();

  return (
    <div className="max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
      <ContextSetter type="TOPIC" id={topic.id} />
      {/* Topic Header Banner */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">#{topic.title}</h1>
        {topic.description && <p className="text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">{topic.description}</p>}
      </div>

      {/* Wide Notes Feed */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <i className="lni lni-book text-base" /> Topic Knowledge Notes ({topic.notes.length})
        </h2>
        <SocialFeed notes={topic.notes as any} showTabs={false} />
      </div>
    </div>
  );
}
