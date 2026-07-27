import db from '@/lib/db';
import { notFound } from 'next/navigation';
import SocialFeed from '@/components/feed/SocialFeed';
import ContextSetter from '@/components/note/ContextSetter';

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const topic = await db.topic.findUnique({
    where: { slug },
    include: {
      notes: {
        include: { topic: true, author: true }
      }
    }
  });

  if (!topic) notFound();

  return (
    <div className="max-w-[640px] mx-auto py-10 w-full">
      <ContextSetter type="TOPIC" id={topic.id} />
      <div className="pb-6 mb-6 border-b border-white/10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[--color-accent-cyan]">{topic.title}</h1>
        {topic.description && <p className="text-sm text-gray-400 max-w-lg mx-auto">{topic.description}</p>}
      </div>
      <SocialFeed notes={topic.notes as any} />
    </div>
  );
}
