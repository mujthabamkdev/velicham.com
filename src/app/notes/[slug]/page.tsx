import db from '@/lib/db';
import { notFound } from 'next/navigation';
import ContextSetter from '@/components/note/ContextSetter';
import { renderMarkdownWithLinks } from '@/lib/utils';
import Link from 'next/link';

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const note = await db.note.findUnique({
    where: { slug },
    include: {
      topic: true,
      author: true,
      outgoingRelations: {
        include: { targetNote: true }
      },
      comments: true,
    }
  });

  if (!note) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full flex flex-col lg:flex-row gap-8">
      <ContextSetter type="NOTE" id={note.id} />
      
      <div className="flex-1">
        <h1 className="text-3xl md:text-5xl font-bold mb-6">{note.title}</h1>
        
        <div className="aspect-video w-full rounded-xl overflow-hidden mb-8 border border-[--color-nebula-mid]">
          <iframe 
            src={`https://www.youtube.com/embed/${note.videoId}`} 
            className="w-full h-full"
            allowFullScreen
          />
        </div>
        
        <div className="prose prose-invert prose-p:text-gray-300 prose-a:text-[--color-accent-cyan] max-w-none"
             dangerouslySetInnerHTML={{ __html: renderMarkdownWithLinks(note.content) }} />
             
        {/* Comments Section */}
        <div className="mt-16 pt-8 border-t border-[--color-nebula-dark]">
          <h3 className="text-2xl font-bold mb-6">Discussion</h3>
          {note.comments.length === 0 ? (
            <p className="text-gray-500">No comments yet. Start the conversation!</p>
          ) : (
            <div className="space-y-4">
              {note.comments.map(comment => (
                <div key={comment.id} className="glass-card p-4 rounded-lg">
                  <p>{comment.content}</p>
                  {comment.aiReply && (
                    <div className="mt-4 pl-4 border-l-2 border-[--color-accent-purple]">
                      <p className="text-sm text-[--color-accent-purple] font-bold mb-1">AI Assistant</p>
                      <p className="text-gray-300 text-sm">{comment.aiReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full lg:w-80 space-y-6">
        <div className="glass-card p-6 rounded-xl border border-[--color-nebula-mid]">
          <h3 className="text-lg font-bold mb-4 text-[--color-accent-pink]">Metadata</h3>
          {note.topic && (
            <div className="mb-4">
              <span className="block text-sm text-gray-400 mb-1">Topic</span>
              <Link href={`/topics/${note.topic.slug}`} className="text-[--color-accent-cyan] hover:underline">
                {note.topic.title}
              </Link>
            </div>
          )}
          {note.author && (
            <div>
              <span className="block text-sm text-gray-400 mb-1">Channel</span>
              <Link href={`/channels/${note.author.id}`} className="text-white hover:underline">
                {note.author.name}
              </Link>
            </div>
          )}
        </div>
        
        {note.outgoingRelations.length > 0 && (
          <div className="glass-card p-6 rounded-xl border border-[--color-nebula-mid]">
            <h3 className="text-lg font-bold mb-4 text-[--color-accent-cyan]">Related Notes</h3>
            <ul className="space-y-3">
              {note.outgoingRelations.map(rel => (
                <li key={rel.id}>
                  <Link href={`/notes/${rel.targetNote.slug}`} className="block text-sm hover:text-[--color-accent-cyan] transition">
                    • {rel.targetNote.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
