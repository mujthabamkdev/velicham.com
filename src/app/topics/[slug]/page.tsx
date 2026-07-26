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
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <ContextSetter type="TOPIC" id={topic.id} />
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[--color-accent-cyan]">{topic.title}</h1>
        {topic.description && <p className="text-xl text-gray-400 max-w-2xl mx-auto">{topic.description}</p>}
      </div>
      <SocialFeed notes={topic.notes as any} />
    </div>
  );
}
