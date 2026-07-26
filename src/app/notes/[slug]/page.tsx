import db from "@/lib/db";
import { notFound } from "next/navigation";
import ContextSetter from "@/components/note/ContextSetter";
import { renderMarkdownWithLinks } from "@/lib/utils";
import Link from "next/link";
import NoteCard from "@/components/feed/NoteCard";

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const note = await db.note.findUnique({
    where: { slug },
    include: {
      topic: true,
      author: true,
      outgoingRelations: {
        include: { targetNote: true },
      },
      comments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!note) notFound();

  // Fetch sibling notes in the same topic for the X-style scroll stream below
  const relatedTopicNotes = note.topicId
    ? await db.note.findMany({
        where: {
          topicId: note.topicId,
          NOT: { id: note.id },
        },
        include: { topic: true, author: true },
        take: 4,
      })
    : [];

  const authorName = note.author?.name || "Velicham Explorer";
  const authorHandle = `@${authorName.toLowerCase().replace(/\s+/g, "")}`;
  const parsedTimestamps: Array<{ timestamp: string; text: string }> =
    note.timestamps ? JSON.parse(note.timestamps) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 w-full flex flex-col gap-10">
      <ContextSetter type="NOTE" id={note.id} title={note.title} />

      {/* Main Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Note Details Post Card */}
        <article className="lg:col-span-8 space-y-8">
          {/* Post Header Card (X Post Style) */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
            {/* Top Row: Author info & Topic chip */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[--color-accent-purple] to-[--color-accent-cyan] flex items-center justify-center font-bold text-white shadow-lg text-base">
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  {note.author ? (
                    <Link
                      href={`/channels/${note.author.id}`}
                      className="font-bold text-white hover:underline text-base block"
                    >
                      {authorName}
                    </Link>
                  ) : (
                    <span className="font-bold text-white text-base block">
                      {authorName}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 font-mono">
                    {authorHandle} •{" "}
                    {new Date(note.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {note.topic && (
                <Link
                  href={`/topics/${note.topic.slug}`}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[--color-accent-cyan] font-semibold hover:bg-white/10 transition"
                >
                  {note.topic.title}
                </Link>
              )}
            </div>

            {/* Note Title */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
              {note.title}
            </h1>

            {/* Executive Summary Callout Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[--color-nebula-mid] to-transparent border-l-4 border-[--color-accent-purple] mb-6 text-gray-200 text-sm leading-relaxed">
              <span className="font-bold text-[--color-accent-purple] block mb-1 uppercase tracking-wider text-xs">
                ⚡ Summary Overview
              </span>
              {note.summary}
            </div>

            {/* Embedded YouTube Video Container */}
            <div className="aspect-video w-full rounded-xl overflow-hidden mb-6 border border-white/10 shadow-lg bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${note.videoId}`}
                className="w-full h-full"
                allowFullScreen
                title={note.title}
              />
            </div>

            {/* Interactive Timestamps Chips */}
            {parsedTimestamps.length > 0 && (
              <div className="mb-8">
                <span className="text-xs font-mono uppercase text-gray-400 tracking-wider block mb-2">
                  📌 Key Timestamps
                </span>
                <div className="flex flex-wrap gap-2">
                  {parsedTimestamps.map((ts, idx) => (
                    <a
                      key={idx}
                      href={`https://www.youtube.com/watch?v=${note.videoId}&t=${ts.timestamp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-[--color-accent-cyan] text-xs font-mono text-gray-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      <span className="text-[--color-accent-cyan] font-bold">
                        {ts.timestamp}
                      </span>
                      <span>{ts.text}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Formatted Markdown Content with Connected Wiki Links */}
            <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-[--color-accent-cyan] prose-strong:text-white prose-li:text-gray-300">
              <div
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownWithLinks(note.content),
                }}
              />
            </div>
          </div>

          {/* X-Style Comments & Discussion Section */}
          <div id="comments" className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
              <span>Discussion ({note.comments.length})</span>
              <span className="text-xs font-mono text-gray-400 font-normal">
                🤖 AI Moderated Stream
              </span>
            </h3>

            {/* Simple Comment Posting Input */}
            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 flex gap-3">
              <div className="w-9 h-9 rounded-full bg-[--color-accent-purple] text-white flex items-center justify-center font-bold text-xs shrink-0">
                U
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  placeholder="Post a comment or ask a question about this note..."
                  rows={2}
                  className="w-full bg-transparent border-none text-white text-sm focus:outline-none resize-none"
                />
                <div className="flex justify-end">
                  <button className="px-4 py-1.5 rounded-full bg-[--color-accent-purple] text-white font-medium text-xs hover:bg-purple-600 transition shadow">
                    Post Comment
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            {note.comments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">
                No comments yet. Start the conversation!
              </p>
            ) : (
              <div className="space-y-4">
                {note.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {comment.user?.name || "Community Explorer"}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                        ✓ AI Verified
                      </span>
                    </div>

                    <p className="text-sm text-gray-200">{comment.content}</p>

                    {/* AI Agent Auto-Reply Thread */}
                    {comment.aiReply && (
                      <div className="mt-3 p-3 rounded-lg bg-[--color-nebula-mid] border-l-2 border-[--color-accent-purple] space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">✨</span>
                          <span className="text-xs font-bold text-[--color-accent-purple]">
                            Velicham AI Assistant
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          {comment.aiReply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Right Column: Metadata & Connected Constellation Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Metadata Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[--color-accent-pink]">
              Knowledge Constellation
            </h4>

            {note.topic && (
              <div>
                <span className="block text-xs text-gray-400 mb-1 font-mono">
                  Topic Group
                </span>
                <Link
                  href={`/topics/${note.topic.slug}`}
                  className="text-sm text-[--color-accent-cyan] hover:underline font-medium block"
                >
                  {note.topic.title}
                </Link>
              </div>
            )}

            {note.author && (
              <div>
                <span className="block text-xs text-gray-400 mb-1 font-mono">
                  Author / Channel
                </span>
                <Link
                  href={`/channels/${note.author.id}`}
                  className="text-sm text-white hover:underline font-medium block"
                >
                  {note.author.name}
                </Link>
              </div>
            )}

            <div>
              <span className="block text-xs text-gray-400 mb-1 font-mono">
                YouTube Source
              </span>
              <a
                href={note.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-300 hover:text-white underline truncate block"
              >
                Watch on YouTube ↗
              </a>
            </div>
          </div>

          {/* Direct Connected Notes Edge Links */}
          {note.outgoingRelations.length > 0 && (
            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[--color-accent-cyan]">
                Connected Notes ({note.outgoingRelations.length})
              </h4>
              <div className="space-y-2">
                {note.outgoingRelations.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/notes/${rel.targetNote.slug}`}
                    className="block p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-xs text-gray-200 hover:text-white font-medium"
                  >
                    🔗 {rel.targetNote.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* X-Style Feed Section on Scroll Below Note Details */}
      {relatedTopicNotes.length > 0 && (
        <section className="pt-10 border-t border-white/10 space-y-6">
          <h3 className="text-2xl font-bold text-white">
            More in {note.topic?.title || "this Topic"} (X-Post Stream)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedTopicNotes.map((relNote) => (
              <NoteCard key={relNote.id} note={relNote} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
