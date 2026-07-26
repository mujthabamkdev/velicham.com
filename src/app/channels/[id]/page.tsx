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
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <ContextSetter type="CHANNEL" id={channel.id} />
      <div className="mb-12 flex items-center gap-6">
        {channel.avatarUrl && (
          <img src={channel.avatarUrl} alt={channel.name} className="w-24 h-24 rounded-full border-2 border-[--color-accent-purple]" />
        )}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{channel.name}</h1>
          {channel.description && <p className="text-gray-400 max-w-2xl">{channel.description}</p>}
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-6 border-b border-[--color-nebula-dark] pb-2">All Notes</h2>
      <SocialFeed notes={channel.notes as any} />
    </div>
  );
}
