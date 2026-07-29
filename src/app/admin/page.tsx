import db from '@/lib/db';
import NoteCard from '@/components/feed/NoteCard';
import AdminIngestPanel from './AdminIngestPanel';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSessionUser();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const notes = await db.note.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      topic: true,
      author: true,
      comments: true,
    },
  });

  const topics = await db.topic.findMany({ orderBy: { title: 'asc' } });
  const channels = await db.channel.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Mission Control</h1>
          <p className="text-sm text-gray-400 mt-1">Ingest YouTube notes, track progress, manage topics, and organize content.</p>
        </div>
        <div className="px-4 py-1.5 rounded-full glass-input text-xs font-mono text-gray-300">
          {notes.length} Total Notes
        </div>
      </div>

      {/* Ingest Panel & Live Notification Progress Tracker */}
      <AdminIngestPanel topics={topics} channels={channels} />

      {/* Knowledge Archive Grid */}
      <section className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-white">Knowledge Base Stream ({notes.length})</h2>
        {notes.length === 0 ? (
          <div className="p-12 text-center glass-card max-w-xl mx-auto rounded-2xl space-y-3">
            <div className="text-4xl">📂</div>
            <h3 className="text-lg font-bold text-white">No Notes in Knowledge Base</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your knowledge base is currently clean. Use the ingest form above to generate your first note.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} showAdminControls={true} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
