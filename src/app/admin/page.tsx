import db from '@/lib/db';
import { ingestYouTubeVideoFormAction, deleteNoteFormAction, createTopic, createChannel } from './actions';

export default async function AdminPage() {
  const notes = await db.note.findMany({ orderBy: { createdAt: 'desc' } });
  const topics = await db.topic.findMany();
  const channels = await db.channel.findMany();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <h1 className="text-4xl font-bold mb-8">Mission Control</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="glass-card p-6 rounded-xl border border-[--color-nebula-mid]">
          <h2 className="text-2xl font-bold mb-4">Ingest Knowledge (YouTube)</h2>
          <form action={ingestYouTubeVideoFormAction} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-gray-400">YouTube URL</label>
              <input name="youtubeUrl" type="url" required className="w-full bg-[--color-void] border border-[--color-nebula-mid] rounded p-2 focus:border-[--color-accent-cyan] outline-none text-white" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-400">Topic</label>
              <select name="topicId" className="w-full bg-[--color-void] border border-[--color-nebula-mid] rounded p-2 text-white">
                <option value="">-- Create or select later --</option>
                {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-400">Channel</label>
              <select name="channelId" className="w-full bg-[--color-void] border border-[--color-nebula-mid] rounded p-2 text-white">
                <option value="">-- Create or select later --</option>
                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[--color-accent-purple] hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition">
              Process Video (AI Magic)
            </button>
          </form>
        </section>
        
        <div className="space-y-8">
          <section className="glass-card p-6 rounded-xl border border-[--color-nebula-mid]">
            <h2 className="text-xl font-bold mb-4">Add Topic</h2>
            <form action={createTopic} className="space-y-4">
              <input name="title" type="text" placeholder="Topic Title" required className="w-full bg-[--color-void] border border-[--color-nebula-mid] rounded p-2 text-white" />
              <button type="submit" className="bg-[--color-nebula-dark] hover:bg-[--color-nebula-mid] text-white py-1 px-4 rounded transition border border-[--color-nebula-mid]">Create Topic</button>
            </form>
          </section>
          
          <section className="glass-card p-6 rounded-xl border border-[--color-nebula-mid]">
            <h2 className="text-xl font-bold mb-4">Add Channel</h2>
            <form action={createChannel} className="space-y-4">
              <input name="name" type="text" placeholder="Channel Name" required className="w-full bg-[--color-void] border border-[--color-nebula-mid] rounded p-2 mb-2 text-white" />
              <input name="youtubeChannelId" type="text" placeholder="YouTube Channel ID" required className="w-full bg-[--color-void] border border-[--color-nebula-mid] rounded p-2 text-white" />
              <button type="submit" className="bg-[--color-nebula-dark] hover:bg-[--color-nebula-mid] text-white py-1 px-4 rounded transition border border-[--color-nebula-mid]">Create Channel</button>
            </form>
          </section>
        </div>
      </div>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Knowledge Archive</h2>
        <div className="overflow-x-auto glass-card rounded-xl border border-[--color-nebula-mid]">
          <table className="w-full text-left">
            <thead className="bg-[--color-nebula-dark] border-b border-[--color-nebula-mid]">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Created</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(note => (
                <tr key={note.id} className="border-b border-[--color-nebula-dark] hover:bg-[--color-nebula-dark]/50">
                  <td className="p-4">{note.title}</td>
                  <td className="p-4 text-sm text-gray-400">{note.slug}</td>
                  <td className="p-4 text-sm text-gray-400">{note.createdAt.toLocaleDateString()}</td>
                  <td className="p-4">
                    <form action={deleteNoteFormAction}>
                      <input type="hidden" name="id" value={note.id} />
                      <button type="submit" className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
