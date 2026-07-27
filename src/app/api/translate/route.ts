import { NextResponse } from 'next/server';
import { translateNoteContent } from '@/lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, summary, content, targetLang } = body;

    if (!title || !content || !targetLang) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const translated = await translateNoteContent(title, summary || '', content, targetLang);
    return NextResponse.json(translated);
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
