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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full space-y-10">
      <ContextSetter type="NOTE" id={note.id} title={note.title} />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Column: Note Article */}
        <article className="lg:col-span-8 space-y-6">
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            {/* Author Header Row */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[--color-accent-purple] to-[--color-accent-cyan] flex items-center justify-center font-bold text-white shadow text-sm shrink-0">
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  {note.author ? (
                    <Link
                      href={`/channels/${note.author.id}`}
                      className="font-bold text-white hover:underline text-sm block"
                    >
                      {authorName}
                    </Link>
                  ) : (
                    <span className="font-bold text-white text-sm block">
                      {authorName}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 font-mono">
                    {authorHandle} •{" "}
                    {new Date(note.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {note.topic && (
                <Link
                  href={`/topics/${note.topic.slug}`}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[--color-accent-cyan] font-semibold hover:bg-white/10 transition"
                >
                  {note.topic.title}
                </Link>
              )}
            </div>

            {/* Note Title & Source Link Badge */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                {note.title}
              </h1>

              {/* Source Link (Text preview only, no video player or timestamps) */}
              {note.youtubeUrl && (
                <div>
                  <a
                    href={note.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[--color-accent-pink]/10 border border-[--color-accent-pink]/20 text-[--color-accent-pink] text-xs font-mono font-medium hover:bg-[--color-accent-pink]/20 transition"
                  >
                    <span>▶ Watch Original Video Source on YouTube</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-xl bg-white/5 border-l-4 border-[--color-accent-purple] text-gray-200 text-xs sm:text-sm leading-relaxed">
              <span className="font-bold text-[--color-accent-purple] block mb-1 uppercase tracking-wider text-[10px] font-mono">
                ⚡ Summary Takeaway
              </span>
              {note.summary}
            </div>

            {/* Formatted Markdown Content */}
            <div className="pt-2 prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-p:text-sm prose-p:leading-relaxed prose-a:text-[--color-accent-cyan] prose-strong:text-white">
              <div
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownWithLinks(note.content),
                }}
              />
            </div>
          </div>

          {/* Comments Stream */}
          <div id="comments" className="glass-card rounded-2xl p-6 border border-white/10 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Discussion ({note.comments.length})</span>
              <span className="text-[11px] font-mono text-gray-400 font-normal">
                🤖 AI Moderated Stream
              </span>
            </h3>

            {/* Comment Input */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[--color-accent-purple] text-white flex items-center justify-center font-bold text-xs shrink-0">
                U
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  placeholder="Post a comment or question about this note..."
                  rows={2}
                  className="w-full bg-transparent border-none text-white text-xs focus:outline-none resize-none placeholder-gray-400"
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
              <p className="text-gray-400 text-xs text-center py-4">
                No comments yet. Start the conversation!
              </p>
            ) : (
              <div className="space-y-3">
                {note.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
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

                    <p className="text-gray-300">{comment.content}</p>

                    {comment.aiReply && (
                      <div className="mt-2 p-3 rounded-lg bg-[--color-nebula-mid] border-l-2 border-[--color-accent-purple] space-y-1">
                        <div className="flex items-center gap-1">
                          <span>✨</span>
                          <span className="font-bold text-[--color-accent-purple]">
                            Velicham AI Assistant
                          </span>
                        </div>
                        <p className="text-gray-300">{comment.aiReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Metadata Card */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-4 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[--color-accent-pink] font-mono text-[11px]">
              Knowledge Constellation
            </h4>

            {note.topic && (
              <div>
                <span className="block text-gray-400 font-mono mb-0.5">
                  Topic Group
                </span>
                <Link
                  href={`/topics/${note.topic.slug}`}
                  className="text-[--color-accent-cyan] hover:underline font-semibold block"
                >
                  {note.topic.title}
                </Link>
              </div>
            )}

            {note.author && (
              <div>
                <span className="block text-gray-400 font-mono mb-0.5">
                  Author / Channel
                </span>
                <Link
                  href={`/channels/${note.author.id}`}
                  className="text-white hover:underline font-semibold block"
                >
                  {note.author.name}
                </Link>
              </div>
            )}

            <div>
              <span className="block text-gray-400 font-mono mb-0.5">
                Video Link Preview
              </span>
              <a
                href={note.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white underline truncate block"
              >
                {note.title} (YouTube) ↗
              </a>
            </div>
          </div>

          {/* Related Connected Notes */}
          {note.outgoingRelations.length > 0 && (
            <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-[--color-accent-cyan] font-mono text-[11px]">
                Connected Notes ({note.outgoingRelations.length})
              </h4>
              <div className="space-y-2">
                {note.outgoingRelations.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/notes/${rel.targetNote.slug}`}
                    className="block p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-gray-200 hover:text-white font-medium"
                  >
                    🔗 {rel.targetNote.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* X-Post Timeline Stream on Scroll */}
      {relatedTopicNotes.length > 0 && (
        <section className="pt-10 border-t border-white/10 space-y-6">
          <div className="max-w-[640px] mx-auto">
            <h3 className="text-lg font-bold text-white mb-4">
              More in {note.topic?.title || "this Topic"} (Timeline Stream)
            </h3>
            <div className="space-y-4">
              {relatedTopicNotes.map((relNote) => (
                <NoteCard key={relNote.id} note={relNote} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
