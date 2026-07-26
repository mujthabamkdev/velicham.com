import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ notes: [], topics: [], channels: [] });
  }

  try {
    const [notes, topics, channels] = await Promise.all([
      db.note.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { summary: { contains: q } }
          ]
        },
        take: 5
      }),
      db.topic.findMany({
        where: { title: { contains: q } },
        take: 3
      }),
      db.channel.findMany({
        where: { name: { contains: q } },
        take: 3
      })
    ]);

    return NextResponse.json({ notes, topics, channels });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
