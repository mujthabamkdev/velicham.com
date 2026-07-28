import db from "@/lib/db";
import { notFound } from "next/navigation";
import ContextSetter from "@/components/note/ContextSetter";
import { renderMarkdownWithLinks, formatDate } from "@/lib/utils";
import Link from "next/link";
import NoteCard from "@/components/feed/NoteCard";
import SocialFeed from "@/components/feed/SocialFeed";
import NoteBrainMapButton from "@/components/note/NoteBrainMapButton";
import JumpToSectionHandler from "@/components/note/JumpToSectionHandler";

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
      userCreator: true,
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
        take: 10,
        include: {
          topic: true,
          author: true,
          userCreator: true,
          comments: true,
        },
      })
    : [];

  const authorName = note.author?.name || "Velicham Explorer";
  const authorHandle = `@${authorName.toLowerCase().replace(/\s+/g, "")}`;

  return (
    <div className="max-w-[800px] mx-auto py-10 w-full">
      <ContextSetter type="NOTE" id={note.id} title={note.title} />
      <JumpToSectionHandler />

      {/* Main Content Column */}
      <article className="space-y-6">
        {/* Note Card */}
        <div className="bg-[#0c0728]/70 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          {/* Author Header Row */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[--color-accent-purple] to-[--color-accent-cyan] flex items-center justify-center font-bold text-white shadow text-sm shrink-0">
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                {note.author ? (
                  <Link
                    href={`/channels/${note.author.id}`}
                    className="font-bold text-white hover:underline text-sm block truncate"
                  >
                    {authorName}
                  </Link>
                ) : (
                  <span className="font-bold text-white text-sm block truncate">
                    {authorName}
                  </span>
                )}
                <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                  {authorHandle}
                  <span className="text-gray-500">·</span>
                  {formatDate(new Date(note.createdAt))}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pl-2 relative">
              <NoteBrainMapButton note={note} />

              {note.topic && (
                <Link
                  href={`/topics/${note.topic.slug}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[--color-accent-cyan] font-semibold hover:bg-white/10 transition shrink-0 whitespace-nowrap"
                >
                  {note.topic.title}
                </Link>
              )}
            </div>
          </div>

          {/* Note Title & Source Link */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-snug">
              {note.title}
            </h1>

            {note.youtubeUrl && (
              <a
                href={note.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[--color-accent-pink]/10 border border-[--color-accent-pink]/20 text-[--color-accent-pink] text-xs font-mono font-medium hover:bg-[--color-accent-pink]/20 transition"
              >
                <span>▶ Watch Original Video Source on YouTube</span>
                <span>↗</span>
              </a>
            )}
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-white/5 border-l-4 border-[--color-accent-purple] text-gray-200 text-sm leading-relaxed">
            <span className="font-bold text-[--color-accent-purple] block mb-2 uppercase tracking-wider text-[10px] font-mono">
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
        <div id="comments" className="bg-[#0c0728]/70 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center justify-between">
            <span>Discussion ({note.comments.length})</span>
            <span className="text-xs font-mono text-gray-400 font-normal">
              🤖 AI Moderated Stream
            </span>
          </h3>

          {/* Comment Input */}
          <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 flex gap-3">
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
            <div className="space-y-4">
              {note.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {comment.user?.name || "Community Explorer"}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {formatDate(new Date(comment.createdAt))}
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

      {/* Related Notes Stream */}
      {relatedTopicNotes.length > 0 && (
        <section className="pt-8 mt-10 border-t border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">
            More in {note.topic?.title || "this Topic"} (Timeline Stream)
          </h3>
          <div className="max-w-[640px]">
            <SocialFeed notes={relatedTopicNotes as any} />
          </div>
        </section>
      )}
    </div>
  );
}
