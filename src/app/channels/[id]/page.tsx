import db from '@/lib/db';
import { notFound } from 'next/navigation';
import SocialFeed from '@/components/feed/SocialFeed';
import ContextSetter from '@/components/note/ContextSetter';

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const channel = await db.channel.findUnique({
    where: { id },
    include: {
      notes: {
        include: { topic: true, author: true }
      },
      topics: true
    }
  });

  if (!channel) notFound();

  return (
    <div className="max-w-[640px] mx-auto py-10 w-full">
      <ContextSetter type="CHANNEL" id={channel.id} />
      <div className="pb-6 mb-6 border-b border-white/10 flex items-center gap-4">
        {channel.avatarUrl && (
          <img src={channel.avatarUrl} alt={channel.name} className="w-14 h-14 rounded-full border border-white/20" />
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">{channel.name}</h1>
          {channel.description && <p className="text-sm text-gray-400">{channel.description}</p>}
        </div>
      </div>
      
      <h2 className="text-lg font-bold mb-4">All Notes</h2>
      <SocialFeed notes={channel.notes as any} />
    </div>
  );
}
