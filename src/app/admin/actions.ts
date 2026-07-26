'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/utils';
import { extractVideoId, fetchTranscript } from '@/lib/youtube';
import { generateNoteFromTranscript, generateLinks } from '@/lib/ai/gemini';

export async function ingestYouTubeVideo(formData: FormData) {
  const youtubeUrl = formData.get('youtubeUrl') as string;
  const topicId = formData.get('topicId') as string;
  const channelId = formData.get('channelId') as string;

  if (!youtubeUrl) {
    return { error: 'YouTube URL is required' };
  }

  try {
    // 1. Extract video ID
    const videoId = extractVideoId(youtubeUrl);

    // 2. Fetch transcript
    const transcript = await fetchTranscript(videoId);

    // 3. Generate note from transcript via Gemini
    const generatedNote = await generateNoteFromTranscript(transcript);

    // 4. Generate bi-directional links
    const existingSlugs = (await db.note.findMany({ select: { slug: true } })).map(
      (n) => n.slug
    );
    const topicSlugs = (await db.topic.findMany({ select: { slug: true } })).map(
      (t) => t.slug
    );
    const allSlugs = [...existingSlugs, ...topicSlugs];

    const linked = await generateLinks(generatedNote.content, allSlugs);

    // 5. Save to database
    const slug = slugify(generatedNote.title);

    // Ensure slug uniqueness
    const existingNote = await db.note.findUnique({ where: { slug } });
    const finalSlug = existingNote
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    await db.note.create({
      data: {
        title: generatedNote.title,
        slug: finalSlug,
        summary: generatedNote.summary,
        content: linked.content,
        youtubeUrl,
        videoId,
        timestamps: JSON.stringify(generatedNote.timestamps),
        topicId: topicId || null,
        authorId: channelId || null,
      },
    });

    // 6. Create NoteRelations for linked slugs
    for (const linkedSlug of linked.linkedSlugs) {
      const targetNote = await db.note.findUnique({
        where: { slug: linkedSlug },
      });
      if (targetNote) {
        const existing = await db.noteRelation.findUnique({
          where: {
            sourceNoteId_targetNoteId: {
              sourceNoteId: finalSlug,
              targetNoteId: targetNote.id,
            },
          },
        });
        if (!existing) {
          const newNote = await db.note.findUnique({ where: { slug: finalSlug } });
          if (newNote) {
            await db.noteRelation.create({
              data: {
                sourceNoteId: newNote.id,
                targetNoteId: targetNote.id,
                type: 'bi-directional',
              },
            });
          }
        }
      }
    }

    revalidatePath('/');
    revalidatePath('/explore');
    revalidatePath('/admin');

    return { success: true, slug: finalSlug };
  } catch (error) {
    console.error('Ingestion failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Ingestion failed',
    };
  }
}

export async function ingestYouTubeVideoFormAction(formData: FormData): Promise<void> {
  await ingestYouTubeVideo(formData);
}

export async function deleteNote(id: string): Promise<void> {
  await db.note.delete({ where: { id } });
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/explore');
}

export async function deleteNoteFormAction(formData: FormData): Promise<void> {
  const id = formData.get('id') as string;
  if (id) {
    await deleteNote(id);
  }
}

export async function updateNote(
  noteId: string,
  data: { title?: string; content?: string; summary?: string }
) {
  const updateData: Record<string, string> = {};
  if (data.title) updateData.title = data.title;
  if (data.content) updateData.content = data.content;
  if (data.summary) updateData.summary = data.summary;

  await db.note.update({
    where: { id: noteId },
    data: updateData,
  });

  revalidatePath('/admin');
  revalidatePath('/');
}

export async function createTopic(formData: FormData): Promise<void> {
  const title = formData.get('title') as string;
  const channelId = (formData.get('channelId') as string) || null;
  if (!title) return;

  await db.topic.create({
    data: {
      title,
      slug: slugify(title),
      channelId,
    },
  });
  revalidatePath('/admin');
}

export async function createChannel(formData: FormData): Promise<void> {
  const name = formData.get('name') as string;
  const youtubeChannelId = formData.get('youtubeChannelId') as string;
  if (!name || !youtubeChannelId) return;

  await db.channel.create({
    data: { name, youtubeChannelId },
  });
  revalidatePath('/admin');
}
