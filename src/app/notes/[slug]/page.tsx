import db from "@/lib/db";
import { notFound } from "next/navigation";
import ContextSetter from "@/components/note/ContextSetter";
import { renderMarkdownWithLinks, formatDate } from "@/lib/utils";
import Link from "next/link";
import NoteCard from "@/components/feed/NoteCard";
import SocialFeed from "@/components/feed/SocialFeed";
import NoteBrainMapButton from "@/components/note/NoteBrainMapButton";
import JumpToSectionHandler from "@/components/note/JumpToSectionHandler";
import NoteActions from "@/components/note/NoteActions";
export const dynamic = "force-dynamic";

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let note = await db.note.findUnique({
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

  if (!note && decodedSlug !== slug) {
    note = await db.note.findUnique({
      where: { slug: decodedSlug },
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
  }

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
    <div className="max-w-5xl mx-auto py-8 sm:py-12 w-full px-4 space-y-8">
      <ContextSetter type="NOTE" id={note.id} title={note.title} />
      <JumpToSectionHandler />

      {/* Main Content Column */}
      <article className="space-y-6">
        {/* Note Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Author Header Row */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#27272a]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-black shadow text-sm shrink-0 overflow-hidden">
                {note.author?.avatarUrl ? (
                  <img src={note.author.avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                ) : note.userCreator?.avatar ? (
                  <img src={note.userCreator.avatar} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  authorName.charAt(0).toUpperCase()
                )}
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
                  className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition shrink-0 whitespace-nowrap"
                >
                  #{note.topic.title}
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
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-mono font-medium hover:bg-white/20 transition"
              >
                <span>▶ Watch Original Video Source on YouTube</span>
                <span>↗</span>
              </a>
            )}
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-[#0f0f11] border-l-4 border-white text-gray-200 text-sm leading-relaxed">
            <span className="font-bold text-white block mb-2 uppercase tracking-wider text-[10px] font-mono">
              ⚡ Executive Summary
            </span>
            {note.summary}
          </div>

          {/* Formatted Markdown Content */}
          <div className="pt-2 prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-p:text-sm prose-p:leading-relaxed prose-a:text-white prose-strong:text-white">
            <div
              dangerouslySetInnerHTML={{
                __html: renderMarkdownWithLinks(note.content),
              }}
            />
          </div>

          {/* Like, Share Public URL & Brain Map Action Bar */}
          <NoteActions note={note} />
        </div>

        {/* Interactive Comments & Discussion Stream */}
        <CommentSection noteId={note.id} initialComments={note.comments} />
      </article>

      {/* Related Notes Stream */}
      {relatedTopicNotes.length > 0 && (
        <section className="pt-8 mt-10 border-t border-[#27272a] space-y-4">
          <h3 className="text-lg font-bold text-white">
            More in {note.topic?.title || "this Topic"} (Timeline Stream)
          </h3>
          <div className="w-full">
            <SocialFeed notes={relatedTopicNotes as any} showTabs={false} />
          </div>
        </section>
      )}
    </div>
  );
}
