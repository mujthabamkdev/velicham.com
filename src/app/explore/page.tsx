import db from "@/lib/db";
import ContextSetter from "@/components/note/ContextSetter";
import ExploreClient from "./ExploreClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  let notes: any[] = [];
  let topics: any[] = [];
  let relations: any[] = [];

  try {
    notes = await db.note.findMany({ include: { topic: true } });
    topics = await db.topic.findMany();
    relations = await db.noteRelation.findMany();
  } catch (err) {
    console.error("Explore page DB fetch error:", err);
  }

  const nodes = [
    ...topics.map((t) => ({
      id: t.id,
      label: t.title,
      type: "topic" as const,
      slug: t.slug,
      color: "#ffffff",
      size: 8,
    })),
    ...notes.map((n) => ({
      id: n.id,
      label: n.title,
      type: "note" as const,
      slug: n.slug,
      color: "#a3a3a3",
      size: 4,
    })),
  ];

  const links = relations.map((r) => ({
    source: r.sourceNoteId,
    target: r.targetNoteId,
    type: r.type,
  }));

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-black">
      <ContextSetter type="HOME" />
      <ExploreClient data={{ nodes, links }} />
    </div>
  );
}
