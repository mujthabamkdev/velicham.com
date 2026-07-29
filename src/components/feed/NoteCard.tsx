"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAgentStore } from "@/lib/store";
import { formatDateShort } from "@/lib/utils";
import { getTopics, updateNoteTopic, deleteNote, updateNote } from "@/app/admin/actions";
import BrainMapModal from "./BrainMapModal";

function ReplyIcon({ className = "text-base" }: { className?: string }) {
  return <i className={`lni lni-comments-alt ${className}`} />;
}

function RetweetIcon({ className = "text-base" }: { className?: string }) {
  return <i className={`lni lni-reload ${className}`} />;
}

function LikeIcon({ className = "text-base" }: { className?: string }) {
  return <i className={`lni lni-heart ${className}`} />;
}

function BookmarkIcon({ className = "text-base" }: { className?: string }) {
  return <i className={`lni lni-bookmark ${className}`} />;
}

function ShareIcon({ className = "text-base" }: { className?: string }) {
  return <i className={`lni lni-share-alt ${className}`} />;
}

export default function NoteCard({
  note,
  showAdminControls = false,
  isFollowing = false,
  onToggleFollow,
  currentUserId,
  onDeleteNote,
}: {
  note: any;
  showAdminControls?: boolean;
  isFollowing?: boolean;
  onToggleFollow?: (userId: string) => void;
  currentUserId?: string;
  onDeleteNote?: (noteId: string) => void;
}) {
  const { favorites, toggleFavorite, savedNotes, toggleSaveNote } = useAgentStore();
  const isSaved = savedNotes?.includes(note.id);
  const [copied, setCopied] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showBrainMap, setShowBrainMap] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editSummary, setEditSummary] = useState(note.summary);
  const [editContent, setEditContent] = useState(note.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [topics, setTopics] = useState<any[]>([]);
  const [currentTopic, setCurrentTopic] = useState<any>(note.topic);
  const [showTopicMenu, setShowTopicMenu] = useState(false);

  // Author & User Creator Calculation
  const userCreator = note.userCreator;
  const authorName = userCreator
    ? userCreator.name || userCreator.email.split("@")[0]
    : note.author?.name || "VELICHAM Explorer";

  const authorHandle = userCreator
    ? `@${userCreator.name ? userCreator.name.toLowerCase().replace(/\s+/g, "") : userCreator.email.split("@")[0]}`
    : `@${authorName.toLowerCase().replace(/\s+/g, "")}`;

  const isFav = favorites.includes(note.id);

  const fetchTopics = async () => {
    if (topics.length === 0) {
      const all = await getTopics();
      setTopics(all);
    }
  };

  const handleTopicSelect = async (topicId: string) => {
    setShowTopicMenu(false);
    const selected = topics.find((t) => t.id === topicId) || null;
    setCurrentTopic(selected);
    await updateNoteTopic(note.id, topicId);
  };

  const commentCount = note.comments?.length || 0;
  const likeCount = isFav ? 1 : 0;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/notes/${note.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      window.location.href = "/login";
      return;
    }
    toggleFavorite(note.id);
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      window.location.href = "/login";
      return;
    }
    toggleSaveNote(note.id);
  };
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    await deleteNote(note.id);
    setIsDeleted(true);
    if (onDeleteNote) {
      onDeleteNote(note.id);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    await updateNote(note.id, {
      title: editTitle,
      summary: editSummary,
      content: editContent,
    });
    setIsSavingEdit(false);
    setShowEditModal(false);
  };

  const isOwner = Boolean(currentUserId && note.userCreatorId === currentUserId);
  const canEditOrDelete = showAdminControls || isOwner;

  if (isDeleted) return null;

  return (
    <>
      <article className="group cursor-pointer glass-card overflow-hidden flex flex-col h-full w-full">
        <div className="p-5 flex flex-col h-full gap-4">

          {/* Header: Avatar, Name, Handle, Follow Button, Date & Move Topic */}
          <div className="flex items-center justify-between w-full relative">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-black shadow-md text-sm shrink-0 overflow-hidden">
                {note.author?.avatarUrl ? (
                  <img src={note.author.avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                ) : userCreator?.avatar ? (
                  <img src={userCreator.avatar} alt={authorName} className="w-full h-full object-cover" />
                ) : (
                  authorName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <div className="flex items-center gap-2">
                  {note.author ? (
                    <Link
                      href={`/channels/${note.author.id}`}
                      className="font-bold text-white text-sm hover:underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {authorName}
                    </Link>
                  ) : (
                    <span className="font-bold text-white text-sm truncate">
                      {authorName}
                    </span>
                  )}

                  {/* Follow Button for User Creator */}
                  {userCreator && onToggleFollow && userCreator.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleFollow(userCreator.id);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono transition border ${isFollowing
                        ? "bg-white text-black border-white hover:bg-gray-200"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                        }`}
                    >
                      {isFollowing ? "Following" : "+ Follow"}
                    </button>
                  )}
                </div>
                <span className="text-gray-400 text-xs truncate">
                  {authorHandle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pl-2 relative">
              <span className="text-[11px] text-gray-400 font-mono hidden md:inline mr-1">
                {formatDateShort(new Date(note.createdAt || "2026-01-01"))}
              </span>

              {/* Edit, Move & Delete Controls for Owner or Admin */}
              {canEditOrDelete && (
                <div className="flex items-center gap-1">
                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditModal(true);
                    }}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition flex items-center justify-center border border-white/10"
                    title="Edit Note"
                  >
                    <i className="lni lni-pencil text-xs" />
                  </button>

                  {/* Move to Topic Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchTopics();
                        setShowTopicMenu(!showTopicMenu);
                      }}
                      className="h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition flex items-center gap-1 text-[11px] font-semibold border border-white/10"
                      title="Move to Topic"
                    >
                      <i className="lni lni-folder text-xs" />
                      <span>Move</span>
                    </button>

                    {showTopicMenu && (
                      <div
                        className="absolute right-0 top-8 z-50 w-48 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl p-1 text-xs space-y-1 max-h-60 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-2 py-1 text-[10px] font-mono text-gray-400 uppercase tracking-wider border-b border-[#27272a]">
                          Assign Topic
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTopicSelect("")}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 truncate transition ${!currentTopic ? "font-bold text-white bg-white/10" : "text-gray-300"}`}
                        >
                          -- No Topic --
                        </button>
                        {topics.map((t) => (
                          <button
                            type="button"
                            onClick={() => handleTopicSelect(t.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 truncate transition ${currentTopic?.id === t.id ? "font-bold text-white bg-white/10" : "text-gray-300"}`}
                          >
                            #{t.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition flex items-center justify-center border border-red-500/30"
                    title="Delete Note"
                  >
                    <i className="lni lni-trash-can text-xs" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content: Title & Summary */}
          <div className="flex-1 flex flex-col gap-2">
            <Link href={`/notes/${note.slug}`} className="block">
              <h3 className="text-base sm:text-lg font-bold leading-snug text-white group-hover:text-gray-300 transition-colors flex items-center justify-between gap-2">
                <span>{note.title}</span>
              </h3>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
              {note.summary}
            </p>
          </div>

          {/* YouTube Thumbnail (Styled as a block) */}
          {note.youtubeUrl && (
            <div className="w-full">
              <a
                href={note.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-[--color-border] hover:border-gray-500 transition-colors group/video"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="text-xs font-semibold text-white truncate pr-2">
                    {note.title}
                  </span>
                </div>
                <div className="w-12 h-8 bg-white/10 rounded overflow-hidden flex items-center justify-center shrink-0 group-hover/video:bg-white/20 transition-colors">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </a>
            </div>
          )}

          {/* Tags */}
          {currentTopic && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/topics/${currentTopic.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-3 py-1.5 rounded-full glass-input text-gray-300 hover:text-white transition-colors shrink-0"
              >
                #{currentTopic.title}
              </Link>
            </div>
          )}

          {/* Bottom Action Bar (Compact Grouping) */}
          <div className="flex items-center flex-wrap gap-1.5 pt-2.5 border-t border-[#27272a] text-xs">
            {/* Comments Anchor */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); window.location.href = `/notes/${note.slug}#comments`; }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition leading-none bg-white/5 border border-white/5"
              title="Discussion Comments"
            >
              <ReplyIcon className="w-3.5 h-3.5 leading-none" />
              <span className="leading-none">{commentCount}</span>
            </button>

            {/* Like Heart Button */}
            <button
              type="button"
              onClick={handleToggleFav}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full transition leading-none ${
                isFav
                  ? "bg-red-500/10 border border-red-500/30 text-red-400 font-bold"
                  : "bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              }`}
              title={isFav ? "Unlike Note" : "Like Note"}
            >
              <i className={`lni lni-heart text-xs leading-none ${isFav ? "text-red-500" : ""}`} />
              <span className="leading-none">{likeCount}</span>
            </button>

            {/* Save Bookmark Button */}
            <button
              type="button"
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full transition leading-none ${
                isSaved
                  ? "bg-white text-black border border-white font-bold"
                  : "bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              }`}
              title={isSaved ? "Remove from Saved Notes" : "Save Note"}
            >
              <BookmarkIcon className={`w-3.5 h-3.5 leading-none ${isSaved ? "fill-black" : ""}`} />
            </button>

            {/* Share Public URL Button */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition leading-none"
              title="Share Link"
            >
              {copied ? (
                <span className="text-[10px] text-emerald-400 font-bold leading-none">Copied!</span>
              ) : (
                <ShareIcon className="w-3.5 h-3.5 leading-none" />
              )}
            </button>

            {/* Obsidian Brain Map Modal Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowBrainMap(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-black hover:bg-gray-200 transition font-bold font-mono text-[10px] leading-none shrink-0 shadow-sm ml-auto"
              title="Open Obsidian Brain Graph"
              style={{ color: "black" }}
            >
              <i className="lni lni-network text-[10px] text-black leading-none" />
              <span className="leading-none">Brain Map</span>
            </button>
          </div>

        </div>
      </article>

      {/* Modern Glassmorphic Delete Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirmModal(false);
          }}
        >
          <div
            className="w-full max-w-sm glass-card p-6 rounded-2xl border border-white/20 shadow-2xl space-y-5 text-center bg-[#0a0a16]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Delete Note?</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to delete <span className="text-white font-semibold">"{note.title}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-full border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Note"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modern Glassmorphic Edit Note Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setShowEditModal(false);
          }}
        >
          <div
            className="w-full max-w-2xl glass-card p-6 rounded-2xl border border-white/20 shadow-2xl space-y-4 bg-[#0a0a16] text-left max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ✏️ Edit Knowledge Note
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Summary (Brief Overview)
                </label>
                <textarea
                  rows={3}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  required
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Full Markdown Content
                </label>
                <textarea
                  rows={10}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-white text-xs font-mono leading-relaxed focus:outline-none focus:border-white transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-full border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold transition shadow-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingEdit ? "Saving..." : "Save Note Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Brain Map Modal Visualization */}
      <BrainMapModal
        note={note}
        isOpen={showBrainMap}
        onClose={() => setShowBrainMap(false)}
      />
    </>
  );
}