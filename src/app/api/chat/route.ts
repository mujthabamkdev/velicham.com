import { NextResponse } from 'next/server';
import { ChatRequestSchema } from '@/lib/types';
import db from '@/lib/db';
import { streamChat } from '@/lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload' },
        { status: 400 }
      );
    }

    const { message, context } = parsed.data;
    let systemPrompt =
      'You are Velicham AI, a knowledgeable guide for Velicham.com — a cosmic-themed connected knowledge platform. Answer concisely and helpfully. ';

    if (context.type === 'NOTE' && context.id) {
      const note = await db.note.findUnique({
        where: { id: context.id },
        include: { topic: true, author: true },
      });
      if (note) {
        systemPrompt += `The user is viewing a note titled "${note.title}". Summary: ${note.summary}. Full content: ${note.content.slice(0, 3000)}`;
      }
    } else if (context.type === 'TOPIC' && context.id) {
      const topic = await db.topic.findUnique({
        where: { id: context.id },
        include: { notes: { take: 10, select: { title: true, summary: true } } },
      });
      if (topic) {
        const notesList = topic.notes
          .map((n) => `- ${n.title}: ${n.summary}`)
          .join('\n');
        systemPrompt += `The user is viewing the topic "${topic.title}". Notes under this topic:\n${notesList}`;
      }
    } else if (context.type === 'CHANNEL' && context.id) {
      const channel = await db.channel.findUnique({
        where: { id: context.id },
        include: { topics: { take: 10, select: { title: true } } },
      });
      if (channel) {
        systemPrompt += `The user is viewing channel "${channel.name}". Topics: ${channel.topics.map((t) => t.title).join(', ')}`;
      }
    }

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat(message, systemPrompt)) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
