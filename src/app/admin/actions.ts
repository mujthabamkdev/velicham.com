'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/utils';
import { extractVideoId, fetchTranscript, fetchPlaylistVideoIds, fetchVideoMetadata } from '@/lib/youtube';
import { generateNoteFromTranscript, generateLinks } from '@/lib/ai/gemini';
import { createJob, updateJobProgress, failJob, addJobLog } from '@/lib/jobs';

export async function ingestSingleVideo(
  youtubeUrl: string, 
  formTopicId?: string, 
  formChannelId?: string,
  customPrompt?: string,
  jobId?: string
) {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (jobId) addJobLog(jobId, `🔍 Extracting video metadata & oEmbed info for ${videoId}...`);
    
    // 1. Fetch video metadata
    const meta = await fetchVideoMetadata(videoId);
    if (jobId) addJobLog(jobId, `📹 Video loaded: "${meta.title || videoId}" (${meta.channelName || 'Channel'})`);

    // 2. Auto-detect or use provided Channel
    let channelId = formChannelId;
    if (!channelId && meta.channelId) {
      const existingChannel = await db.channel.findFirst({ where: { youtubeChannelId: meta.channelId } });
      if (existingChannel) {
        channelId = existingChannel.id;
      } else {
        const newChannel = await db.channel.create({
          data: { name: meta.channelName || 'Unknown Channel', youtubeChannelId: meta.channelId }
        });
        channelId = newChannel.id;
      }
    }

    // 3. Fetch transcript
    if (jobId) addJobLog(jobId, `📜 Fetching transcript from YouTube...`);
    const transcript = await fetchTranscript(videoId);
    if (jobId) addJobLog(jobId, `✅ Transcript retrieved (${transcript.length} chars).`);

    // 4. Generate note from transcript via Gemini / OpenRouter
    if (jobId) addJobLog(jobId, `🤖 Generating note via OpenRouter AI...`);
    const generatedNote = await generateNoteFromTranscript(transcript, meta.title, customPrompt, jobId);
    if (jobId) addJobLog(jobId, `⚡ AI note generated: "${generatedNote.title}" (Topic: ${generatedNote.suggestedTopic})`);

    // 5. Auto-detect or use provided Topic
    let topicId = formTopicId;
    if (!topicId && generatedNote.suggestedTopic) {
      const suggestedSlug = slugify(generatedNote.suggestedTopic);
      const existingTopic = await db.topic.findUnique({ where: { slug: suggestedSlug } });
      if (existingTopic) {
        topicId = existingTopic.id;
      } else {
        const newTopic = await db.topic.create({
          data: { title: generatedNote.suggestedTopic, slug: suggestedSlug }
        });
        topicId = newTopic.id;
      }
    }

    // 6. Generate bi-directional links
    if (jobId) addJobLog(jobId, `🔗 Resolving concept links & saving note to database...`);
    const existingSlugs = (await db.note.findMany({ select: { slug: true } })).map(n => n.slug);
    const topicSlugs = (await db.topic.findMany({ select: { slug: true } })).map(t => t.slug);
    const allSlugs = [...existingSlugs, ...topicSlugs];

    const linked = await generateLinks(generatedNote.content, allSlugs);

    // 7. Save to database
    const slug = slugify(generatedNote.title);
    const existingNote = await db.note.findUnique({ where: { slug } });
    const finalSlug = existingNote ? `${slug}-${Date.now().toString(36)}` : slug;

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

    if (jobId) addJobLog(jobId, `💾 Note saved successfully with slug: ${finalSlug}`);

    // 8. Create NoteRelations for linked slugs
    for (const linkedSlug of linked.linkedSlugs) {
      const targetNote = await db.note.findUnique({ where: { slug: linkedSlug } });
      if (targetNote) {
        const existing = await db.noteRelation.findUnique({
          where: {
            sourceNoteId_targetNoteId: { sourceNoteId: finalSlug, targetNoteId: targetNote.id },
          },
        });
        if (!existing) {
          const newNote = await db.note.findUnique({ where: { slug: finalSlug } });
          if (newNote) {
            await db.noteRelation.create({
              data: { sourceNoteId: newNote.id, targetNoteId: targetNote.id, type: 'bi-directional' },
            });
          }
        }
      }
    }

    return { success: true, slug: finalSlug };
  } catch (error) {
    console.error('Ingestion failed for', youtubeUrl, error);
    return { error: error instanceof Error ? error.message : 'Ingestion failed' };
  }
}

export async function ingestYouTubeVideoFormAction(formData: FormData): Promise<void> {
  const youtubeUrl = formData.get('youtubeUrl') as string;
  const topicId = formData.get('topicId') as string;
  const channelId = formData.get('channelId') as string;
  const customPrompt = formData.get('customPrompt') as string;

  if (!youtubeUrl) return;

  if (youtubeUrl.includes('list=')) {
    try {
      const videoIds = await fetchPlaylistVideoIds(youtubeUrl);
      if (videoIds.length > 0) {
        const job = createJob(youtubeUrl, videoIds.length);
        
        // Process Video #1 synchronously so user gets immediate response
        try {
          await ingestSingleVideo(`https://youtube.com/watch?v=${videoIds[0]}`, topicId, channelId, customPrompt, job.id);
          updateJobProgress(job.id, 1);
        } catch (err1) {
          console.error("Video 1 processing error:", err1);
        }

        // Process remaining videos in background
        if (videoIds.length > 1) {
          (async () => {
            let count = 1;
            for (let i = 1; i < videoIds.length; i++) {
              await ingestSingleVideo(`https://youtube.com/watch?v=${videoIds[i]}`, topicId, channelId, customPrompt, job.id);
              count++;
              updateJobProgress(job.id, count);
            }
          })().catch(err => {
            failJob(job.id, err instanceof Error ? err.message : 'Playlist processing failed');
          });
        }
      }
    } catch (err) {
      console.error("Playlist ingestion failed:", err);
    }
  } else {
    const job = createJob(youtubeUrl, 1);
    try {
      const res = await ingestSingleVideo(youtubeUrl, topicId, channelId, customPrompt, job.id);
      if (res && 'error' in res && res.error) {
        failJob(job.id, res.error);
      } else {
        updateJobProgress(job.id, 1);
      }
    } catch (err) {
      failJob(job.id, err instanceof Error ? err.message : 'Video processing failed');
    }
  }

  revalidatePath('/');
  revalidatePath('/explore');
  revalidatePath('/admin');
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

export async function getTopics() {
  return db.topic.findMany({
    orderBy: { title: 'asc' },
  });
}

export async function updateNoteTopic(noteId: string, topicId: string | null) {
  await db.note.update({
    where: { id: noteId },
    data: { topicId: topicId || null },
  });
  revalidatePath('/');
  revalidatePath('/explore');
  revalidatePath('/admin');
}
