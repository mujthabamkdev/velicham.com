"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);

  // Fetch logged in user profile on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
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
    <header className="sticky top-0 left-0 right-0 h-16 z-50 glass-panel flex items-center">
      <div className="max-w-6xl mx-auto w-full h-full flex items-center justify-between gap-6 px-4 sm:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-black text-white">
            Velicham
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block relative">
          <div className="relative w-full">
            <svg
              className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
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
                  <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 mb-2 px-1 font-bold">
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
                  <h4 className="text-xs uppercase font-mono tracking-wider text-cyan-400 mb-2 px-1 font-bold">
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
                  <h4 className="text-xs uppercase font-mono tracking-wider text-pink-400 mb-2 px-1 font-bold">
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
            <div className="flex items-center gap-3">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 text-xs font-mono font-bold transition hidden sm:inline-block"
                >
                  ⚡ Admin Panel
                </Link>
              )}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-medium text-white truncate max-w-[120px]">
                  {user.name || user.email.split("@")[0]}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30 uppercase">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 transition font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
