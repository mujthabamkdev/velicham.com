'use client';

import Link from 'next/link';

export default function NoteCard({ note }: { note: any }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden border border-[--color-nebula-mid] hover:border-[--color-accent-purple] transition duration-300 flex flex-col group animate-fade-in-up">
      <Link href={`/notes/${note.slug}`} className="flex-1">
        <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
          <img 
            src={`https://img.youtube.com/vi/${note.videoId}/maxresdefault.jpg`} 
            alt={note.title}
            className="object-cover w-full h-full group-hover:scale-105 transition duration-500"
            onError={(e) => { e.currentTarget.src = 'https://img.youtube.com/vi/' + note.videoId + '/0.jpg' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-xl font-bold mb-2 line-clamp-2">{note.title}</h3>
          <p className="text-gray-400 text-sm line-clamp-3 mb-4">{note.summary}</p>
        </div>
      </Link>
      
      <div className="px-5 pb-5 flex items-center justify-between mt-auto">
        {note.topic && (
          <Link href={`/topics/${note.topic.slug}`} className="text-xs px-3 py-1 rounded-full bg-[--color-nebula-dark] text-[--color-accent-cyan] hover:bg-[--color-nebula-mid] transition">
            {note.topic.title}
          </Link>
        )}
        {note.author && (
          <Link href={`/channels/${note.author.id}`} className="text-xs px-3 py-1 rounded-full border border-[--color-nebula-mid] text-gray-300 hover:text-white transition">
            {note.author.name}
          </Link>
        )}
      </div>
    </div>
  );
}
