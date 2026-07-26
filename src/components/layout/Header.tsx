"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);

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
    <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#030014]/80 backdrop-blur-xl border-b border-white/10 flex items-center px-4 sm:px-8">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        {/* Brand & Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[--color-accent-cyan] via-[--color-accent-purple] to-[--color-accent-pink]">
              Velicham
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-gray-400 group-hover:text-gray-200 transition">
              illuminated notes
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-gray-300">
            <Link
              href="/"
              className="hover:text-[--color-accent-cyan] transition py-1"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="hover:text-[--color-accent-purple] transition py-1"
            >
              Explore Constellation
            </Link>
            <Link
              href="/admin"
              className="hover:text-[--color-accent-pink] transition py-1"
            >
              Mission Control
            </Link>
          </nav>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search notes, topics, authors..."
            className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[--color-accent-cyan] transition"
            value={query}
            onChange={handleSearch}
          />
          {results && (
            <div className="absolute top-10 left-0 right-0 glass-card rounded-2xl p-4 shadow-2xl border border-white/10 max-h-80 overflow-y-auto z-50 text-xs">
              {results.notes?.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-[10px] uppercase font-mono tracking-wider text-[--color-accent-purple] mb-1">
                    Notes
                  </h4>
                  {results.notes.map((n: any) => (
                    <Link
                      key={n.id}
                      href={`/notes/${n.slug}`}
                      className="block hover:bg-white/10 p-2 rounded-lg text-gray-200 hover:text-white transition"
                      onClick={() => setResults(null)}
                    >
                      {n.title}
                    </Link>
                  ))}
                </div>
              )}
              {results.topics?.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-[10px] uppercase font-mono tracking-wider text-[--color-accent-cyan] mb-1">
                    Topics
                  </h4>
                  {results.topics.map((t: any) => (
                    <Link
                      key={t.id}
                      href={`/topics/${t.slug}`}
                      className="block hover:bg-white/10 p-2 rounded-lg text-gray-200 hover:text-white transition"
                      onClick={() => setResults(null)}
                    >
                      {t.title}
                    </Link>
                  ))}
                </div>
              )}
              {results.channels?.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-mono tracking-wider text-[--color-accent-pink] mb-1">
                    Channels
                  </h4>
                  {results.channels.map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/channels/${c.id}`}
                      className="block hover:bg-white/10 p-2 rounded-lg text-gray-200 hover:text-white transition"
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

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 transition"
          >
            + New Note
          </Link>
        </div>
      </div>
    </header>
  );
}
