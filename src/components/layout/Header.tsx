"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import GenerateNoteModal from "@/components/feed/GenerateNoteModal";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const fetchAuthUser = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      });
  };

  // Fetch logged in user profile on mount & on window focus / auth changes
  useEffect(() => {
    fetchAuthUser();

    window.addEventListener("focus", fetchAuthUser);
    window.addEventListener("popstate", fetchAuthUser);
    return () => {
      window.removeEventListener("focus", fetchAuthUser);
      window.removeEventListener("popstate", fetchAuthUser);
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 2) {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setResults(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 left-0 right-0 h-16 z-50 glass-panel flex items-center">
        <div className="max-w-6xl mx-auto w-full h-full flex items-center justify-between gap-6 px-4 sm:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white">
              VELICHAM
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden sm:block relative">
            <div className="relative w-full">
              <i className="lni lni-search-alt text-base text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search knowledge notes..."
                className="w-full glass-input rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400"
                value={query}
                onChange={handleSearch}
              />
            </div>

            {results && (
              <div className="absolute top-full left-0 right-0 mt-2 glass-card p-4 shadow-2xl max-h-80 overflow-y-auto z-50 text-sm">
                {results.notes?.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-gray-400 mb-2 px-1 font-bold">
                      Notes
                    </h4>
                    {results.notes.map((n: any) => (
                      <Link
                        key={n.id}
                        href={`/notes/${n.slug}`}
                        className="block hover:bg-white/10 px-3.5 py-2 rounded-lg text-gray-200 hover:text-white transition my-1"
                        onClick={() => setResults(null)}
                      >
                        {n.title}
                      </Link>
                    ))}
                  </div>
                )}
                {results.topics?.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-white mb-2 px-1 font-bold">
                      Topics
                    </h4>
                    {results.topics.map((t: any) => (
                      <Link
                        key={t.id}
                        href={`/topics/${t.slug}`}
                        className="block hover:bg-white/10 px-3.5 py-2 rounded-lg text-gray-200 hover:text-white transition my-1"
                        onClick={() => setResults(null)}
                      >
                        {t.title}
                      </Link>
                    ))}
                  </div>
                )}
                {results.channels?.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase font-mono tracking-wider text-gray-300 mb-2 px-1 font-bold">
                      Channels
                    </h4>
                    {results.channels.map((c: any) => (
                      <Link
                        key={c.id}
                        href={`/channels/${c.id}`}
                        className="block hover:bg-white/10 px-3.5 py-2 rounded-lg text-gray-200 hover:text-white transition my-1"
                        onClick={() => setResults(null)}
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile / Auth Action */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Generate AI Note Button */}
                <button
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-200 text-black text-xs font-bold transition shadow flex items-center gap-1.5"
                >
                  <i className="lni lni-sparkles text-sm" />
                  <span className="hidden sm:inline">Create AI Note</span>
                </button>

                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-mono font-bold transition hidden sm:inline-block flex items-center gap-1.5"
                  >
                    <i className="lni lni-bolt text-sm" /> Admin Panel
                  </Link>
                )}

                {/* Clickable Profile Icon & User Button */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full pl-1.5 pr-2.5 py-1 text-xs transition group"
                  title="View Profile"
                >
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black font-bold text-[11px] shadow-sm overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="font-medium text-white truncate max-w-[90px] group-hover:text-gray-300 transition hidden sm:inline-block">
                    {user.name || user.email.split("@")[0]}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 transition font-medium hidden sm:inline-block"
                  title="Sign Out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-full bg-white hover:bg-gray-200 text-black text-xs font-bold transition shadow-md"
                style={{ color: "black" }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Note Generation Modal */}
      <GenerateNoteModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
      />
    </>
  );
}
