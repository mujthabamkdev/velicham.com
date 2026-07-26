import db from '@/lib/db';
import SocialFeed from '@/components/feed/SocialFeed';
import GalaxyWrapper from '@/components/galaxy/GalaxyWrapper';
import ContextSetter from '@/components/note/ContextSetter';

export default async function HomePage() {
  const notes = await db.note.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      topic: true,
      author: true,
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <ContextSetter type="HOME" />

      {/* Hero — Galaxy Nebula */}
      <section className="h-[70vh] relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <GalaxyWrapper nebulas={[]} />
        </div>
        <div className="z-10 text-center pointer-events-none select-none">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[--color-accent-cyan] via-[--color-accent-purple] to-[--color-accent-pink] drop-shadow-lg glow-text">
            Velicham
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-gray-300 font-light tracking-wide">
            Illuminate Your Knowledge
          </p>
        </div>
      </section>

      {/* Feed — Recent Discoveries */}
      <section className="max-w-7xl mx-auto px-4 py-16 w-full">
        <h2 className="text-3xl font-bold mb-8 text-white">
          Recent Discoveries
        </h2>
        <SocialFeed notes={notes} />
      </section>
    </div>
  );
}
