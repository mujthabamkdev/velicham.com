'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const router = useRouter();

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
    <header className="fixed top-0 left-0 right-0 h-16 z-50 glass-card flex items-center px-6 border-b border-[--color-nebula-dark]">
      <div className="flex-1 flex items-center gap-6">
        <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[--color-accent-cyan] to-[--color-accent-purple]">
          Velicham
        </Link>
        <nav className="hidden md:flex gap-4">
          <Link href="/" className="hover:text-[--color-accent-cyan] transition">Home</Link>
          <Link href="/explore" className="hover:text-[--color-accent-purple] transition">Explore</Link>
          <Link href="/admin" className="hover:text-[--color-accent-pink] transition">Admin</Link>
        </nav>
      </div>

      <div className="flex-1 flex justify-center relative">
        <input
          type="text"
          placeholder="Search knowledge..."
          className="w-full max-w-md bg-[--color-nebula-dark] border border-[--color-nebula-mid] rounded-full px-4 py-2 focus:outline-none focus:border-[--color-accent-cyan] transition"
          value={query}
          onChange={handleSearch}
        />
        {results && (
          <div className="absolute top-12 left-0 right-0 max-w-md mx-auto glass-card rounded-lg p-4 shadow-xl border border-[--color-nebula-mid] max-h-96 overflow-y-auto">
            {results.notes?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm text-gray-400 font-bold mb-2">Notes</h3>
                {results.notes.map((n: any) => (
                  <Link key={n.id} href={`/notes/${n.slug}`} className="block hover:bg-[--color-nebula-mid] p-2 rounded transition" onClick={() => setResults(null)}>
                    {n.title}
                  </Link>
                ))}
              </div>
            )}
            {results.topics?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm text-gray-400 font-bold mb-2">Topics</h3>
                {results.topics.map((t: any) => (
                  <Link key={t.id} href={`/topics/${t.slug}`} className="block hover:bg-[--color-nebula-mid] p-2 rounded transition" onClick={() => setResults(null)}>
                    {t.title}
                  </Link>
                ))}
              </div>
            )}
            {results.channels?.length > 0 && (
              <div>
                <h3 className="text-sm text-gray-400 font-bold mb-2">Channels</h3>
                {results.channels.map((c: any) => (
                  <Link key={c.id} href={`/channels/${c.id}`} className="block hover:bg-[--color-nebula-mid] p-2 rounded transition" onClick={() => setResults(null)}>
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex justify-end">
        {/* User profile or other actions */}
      </div>
    </header>
  );
}
