"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAgentStore } from "@/lib/store";
import { formatDateShort } from "@/lib/utils";
import { getTopics, updateNoteTopic, deleteNote, updateNote } from "@/app/admin/actions";
import BrainMapModal from "./BrainMapModal";

function ReplyIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function RetweetIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function LikeIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BookmarkIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.58" y2="10.49" />
    </svg>
  );
}

export default function NoteCard({
  note,
  showAdminControls = false,
  isFollowing = false,
  onToggleFollow,
}: {
  note: any;
  showAdminControls?: boolean;
  isFollowing?: boolean;
  onToggleFollow?: (userId: string) => void;
}) {
  const { favorites, toggleFavorite } = useAgentStore();
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
    : note.author?.name || "Velicham Explorer";

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
    toggleFavorite(note.id);
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

  if (isDeleted) return null;

  return (
    <>
      <article className="group cursor-pointer glass-card overflow-hidden flex flex-col h-full w-full">
      <div className="p-5 flex flex-col h-full gap-4">
        
        {/* Header: Avatar, Name, Handle, Follow Button, Date & Move Topic */}
        <div className="flex items-center justify-between w-full relative">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-md ${
              userCreator ? "bg-gradient-to-tr from-purple-500 to-indigo-500 text-white" : "bg-white text-black"
            }`}>
              {authorName.charAt(0).toUpperCase()}
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
                {userCreator && onToggleFollow && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleFollow(userCreator.id);
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono transition border ${
                      isFollowing
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30"
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

          <div className="flex items-center gap-2 shrink-0 pl-2 relative">
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">
              {formatDateShort(new Date(note.createdAt || "2026-01-01"))}
            </span>

            {/* Admin Controls: Move to Topic, Edit & Delete */}
            {showAdminControls && (
              <>
                {/* Edit Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition-colors flex items-center justify-center text-xs border border-white/10 bg-white/5"
                  title="Edit Note"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
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
                    className="px-2.5 py-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs border border-white/10 bg-white/5"
                    title="Move to Topic"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>Move</span>
                  </button>

                  {showTopicMenu && (
                    <div
                      className="absolute right-0 top-8 z-50 w-48 bg-[#0a0a16] border border-white/20 rounded-xl shadow-2xl p-1 text-xs space-y-1 max-h-60 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-2 py-1 text-[10px] font-mono text-gray-400 uppercase tracking-wider border-b border-white/10">
                        Assign Topic
                      </div>
                      <button
                        onClick={() => handleTopicSelect("")}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 truncate transition-colors ${
                          !currentTopic ? "font-bold text-white bg-white/10" : "text-gray-300"
                        }`}
                      >
                        -- No Topic --
                      </button>
                      {topics.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleTopicSelect(t.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 truncate transition-colors ${
                            currentTopic?.id === t.id ? "font-bold text-white bg-white/10" : "text-gray-300"
                          }`}
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
                  className="p-1.5 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors flex items-center justify-center text-xs border border-white/10 bg-white/5"
                  title="Delete Note"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </>
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

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-1 -mx-2">
          <button
            onClick={(e) => { e.stopPropagation(); window.location.href = `/notes/${note.slug}#comments`; }}
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs"
          >
            <ReplyIcon className="w-[18px] h-[18px]" />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>

          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs"
          >
            <RetweetIcon className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={handleToggleFav}
            className={`flex items-center gap-1.5 p-2 rounded-full transition-colors text-xs ${
              isFav ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <LikeIcon className={`w-[18px] h-[18px] ${isFav ? "fill-white stroke-white" : ""}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-xs"
          >
            {copied ? <span className="text-xs text-green-400 font-semibold">Copied</span> : <ShareIcon className="w-[18px] h-[18px]" />}
          </button>

          {/* Brain Map Icon Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowBrainMap(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-black hover:bg-gray-200 transition-colors text-xs font-bold font-mono shadow-sm"
            title="Open Obsidian Brain Graph"
            style={{ color: "black" }}
          >
            <svg className="w-3.5 h-3.5 fill-black shrink-0" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span>Brain Map</span>
          </button>

          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-xs ml-auto"
          >
            <BookmarkIcon className="w-[18px] h-[18px]" />
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