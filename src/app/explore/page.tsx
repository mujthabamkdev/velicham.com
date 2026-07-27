import db from '@/lib/db';
import ContextSetter from '@/components/note/ContextSetter';
import ExploreClient from './ExploreClient';

export default async function ExplorePage() {
  const notes = await db.note.findMany({
    include: { topic: true },
  });
  const topics = await db.topic.findMany();
  const relations = await db.noteRelation.findMany();

  const nodes = [
    ...topics.map((t) => ({
      id: t.id,
      label: t.title,
      type: 'topic' as const,
      slug: t.slug,
      color: '#06b6d4',
      size: 8,
    })),
    ...notes.map((n) => ({
      id: n.id,
      label: n.title,
      type: 'note' as const,
      slug: n.slug,
      color: '#8b5cf6',
      size: 4,
    })),
  ];

  const links = relations.map((r) => ({
    source: r.sourceNoteId,
    target: r.targetNoteId,
    type: r.type,
  }));

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-[--color-void]">
      <ContextSetter type="HOME" />
      <ExploreClient data={{ nodes, links }} />
    </div>
  );
}
