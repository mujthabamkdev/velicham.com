import db from "@/lib/db";
import { notFound } from "next/navigation";
import SocialFeed from "@/components/feed/SocialFeed";
import ContextSetter from "@/components/note/ContextSetter";

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const channel = await db.channel.findUnique({
    where: { id },
    include: {
      notes: {
        include: { topic: true, author: true, userCreator: true, comments: true },
        orderBy: { createdAt: "desc" },
      },
      topics: true,
    },
  });

  if (!channel) notFound();

  return (
    <div className="max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
      <ContextSetter type="CHANNEL" id={channel.id} />
      {/* Channel Header Banner */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {channel.avatarUrl ? (
          <img src={channel.avatarUrl} alt={channel.name} className="w-16 h-16 rounded-full border border-white/20 object-cover shadow-md shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white text-black font-black text-2xl flex items-center justify-center shadow-md shrink-0">
            {channel.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{channel.name}</h1>
            <span className="self-center sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-white border border-white/20">
              {channel.youtubeChannelId}
            </span>
          </div>
          {channel.description && <p className="text-xs text-gray-400 pt-1 leading-relaxed">{channel.description}</p>}
        </div>
      </div>

      {/* Wide Notes Feed */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <i className="lni lni-book text-base" /> Channel Knowledge Notes ({channel.notes.length})
        </h2>
        <SocialFeed notes={channel.notes as any} showTabs={false} />
      </div>
    </div>
  );
}
