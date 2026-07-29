"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NoteCard from "@/components/feed/NoteCard";
import AvatarPickerModal from "@/components/profile/AvatarPickerModal";
import FollowersModal from "@/components/profile/FollowersModal";
import { useAgentStore } from "@/lib/store";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<"CREATED" | "SAVED">("CREATED");

  // Name Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Followers State
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);

  // User Notes State
  const [userNotes, setUserNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);

  // Saved Notes State
  const { savedNotes } = useAgentStore();
  const [savedNotesList, setSavedNotesList] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          fetchUserNotes();
          fetchFollowers();
        } else {
          router.push("/login");
        }
      })
      .catch((e) => {
        console.error("Profile load error:", e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (activeTab === "SAVED") {
      fetchSavedNotes();
    }
  }, [activeTab, savedNotes]);

  const fetchFollowers = async () => {
    try {
      const res = await fetch("/api/users/followers");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFollowerCount(data.followerCount || 0);
          setFollowersList(data.followers || []);
        }
      }
    } catch (e) {
      console.error("Failed to fetch followers:", e);
    }
  };

  const fetchUserNotes = async () => {
    try {
      setNotesLoading(true);
      const res = await fetch("/api/notes/user");
      if (res.ok) {
        const data = await res.json();
        setUserNotes(data.notes || []);
      }
    } catch (e) {
      console.error("Failed to fetch user notes:", e);
    } finally {
      setNotesLoading(false);
    }
  };

  const fetchSavedNotes = async () => {
    if (!savedNotes || savedNotes.length === 0) {
      setSavedNotesList([]);
      return;
    }

    try {
      setSavedLoading(true);
      const res = await fetch(`/api/notes/saved?ids=${savedNotes.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        setSavedNotesList(data.notes || []);
      }
    } catch (e) {
      console.error("Failed to fetch saved notes:", e);
    } finally {
      setSavedLoading(false);
    }
  };

  const handleDeleteNote = (deletedNoteId: string) => {
    setUserNotes((prev) => prev.filter((note) => note.id !== deletedNoteId));
    setSavedNotesList((prev) => prev.filter((note) => note.id !== deletedNoteId));
  };

  const handleUpdateAvatar = async (avatarUrl: string) => {
    const res = await fetch("/api/users/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar: avatarUrl }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update profile photo");
    }

    setUser((prev: any) => ({ ...prev, avatar: avatarUrl }));
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSavingName(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update name");
        return;
      }

      setUser((prev: any) => ({ ...prev, name: data.name }));
      setIsEditingName(false);
    } catch (err) {
      alert("Failed to update display name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="w-full flex-1 text-white flex flex-col font-sans">
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="animate-pulse flex items-center gap-3 text-sm text-gray-400">
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Loading profile details...
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full flex-1 text-gray-100 flex flex-col font-sans">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Profile Card Container */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Profile Header Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar Circle with hover edit button */}
            <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)} title="Click to edit character avatar">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl overflow-hidden">
                <div className="w-full h-full bg-[#18181b] rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="lni lni-pencil text-white text-lg" />
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-[#18181b] rounded-full" title="Active Session" />
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-2 justify-center sm:justify-start">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                      autoFocus
                      className="bg-[#0f0f11] border border-[#27272a] rounded-xl px-3.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-white transition"
                    />
                    <button
                      type="submit"
                      disabled={isSavingName || !nameInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold transition hover:bg-gray-200 disabled:opacity-50"
                    >
                      {isSavingName ? "..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="px-2 py-1.5 text-xs text-gray-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      {user.name || "User"}
                    </h1>
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(user.name || "");
                        setIsEditingName(true);
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
                      title="Edit Display Name"
                    >
                      <i className="lni lni-pencil text-xs" />
                    </button>
                  </div>
                )}
                <span className="self-center sm:self-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-white border border-white/20 uppercase">
                  {user.role} Account
                </span>
              </div>
              <p className="text-sm font-mono text-gray-400">{user.email}</p>

              {/* Followers Badge (Clickable to view self followers list) */}
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setIsFollowersModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white font-mono text-xs font-bold transition shadow-sm"
                  title="Click to view your followers"
                >
                  <i className="lni lni-heart text-red-500 text-xs" />
                  <span>{followerCount} {followerCount === 1 ? "Follower" : "Followers"}</span>
                </button>
              </div>
            </div>

            {/* Quick Actions / Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
              <Link
                href="/profile/api-keys"
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-mono font-bold transition flex items-center gap-2"
              >
                <i className="lni lni-key text-xs" /> My API Keys
              </Link>

              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-mono font-bold transition flex items-center gap-2"
                >
                  <i className="lni lni-bolt text-xs" /> Admin Panel
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium transition flex items-center gap-1.5"
              >
                <i className="lni lni-exit text-xs" /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* User Notes Section with Tabs */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-3 border-b border-[#27272a] pb-4 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("CREATED")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "CREATED"
                  ? "bg-white text-black shadow"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <i className="lni lni-book text-sm" />
              <span>My Created Notes ({userNotes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("SAVED")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "SAVED"
                  ? "bg-white text-black shadow"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <i className="lni lni-bookmark text-sm" />
              <span>Saved Notes ({savedNotes.length})</span>
            </button>
          </div>

          {/* TAB 1: Created Notes */}
          {activeTab === "CREATED" && (
            <>
              {notesLoading ? (
                <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
                  Loading your created notes...
                </div>
              ) : userNotes.length === 0 ? (
                <div className="p-10 text-center glass-card rounded-2xl space-y-3">
                  <div className="text-3xl">📝</div>
                  <h3 className="text-base font-bold text-white">No Notes Created Yet</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    You haven't generated any YouTube knowledge notes yet. Configure your OpenRouter Free AI API Key in <Link href="/profile/api-keys" className="text-white underline font-semibold">My API Keys</Link> and generate your first note!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full">
                  {userNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      currentUserId={user.id}
                      onDeleteNote={handleDeleteNote}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: Saved Notes */}
          {activeTab === "SAVED" && (
            <>
              {savedLoading ? (
                <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
                  Loading your saved bookmarks...
                </div>
              ) : savedNotesList.length === 0 ? (
                <div className="p-10 text-center glass-card rounded-2xl space-y-3">
                  <div className="text-3xl">🔖</div>
                  <h3 className="text-base font-bold text-white">No Saved Notes Yet</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    Bookmark notes across the feed or on note pages using the bookmark icon to save them here for quick access!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full">
                  {savedNotesList.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      currentUserId={user.id}
                      onDeleteNote={handleDeleteNote}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Avatar Selection Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        currentAvatar={user.avatar}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelectAvatar={handleUpdateAvatar}
      />

      {/* Followers Modal (Self Only) */}
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        followers={followersList}
        count={followerCount}
      />
    </div>
  );
}
