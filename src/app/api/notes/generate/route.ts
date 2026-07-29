import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptText } from "@/lib/encryption";
import { generateNoteFromTranscript } from "@/lib/ai/gemini";
import { extractVideoId, fetchTranscript, fetchVideoMetadata } from "@/lib/youtube";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Please log in to generate AI notes" }, { status: 401 });
    }

    const body = await req.json();
    const { youtubeUrl, topicPrompt, customPrompt } = body;

    if (!youtubeUrl && !topicPrompt && !customPrompt) {
      return NextResponse.json(
        { error: "Please provide either a YouTube video URL or a topic prompt" },
        { status: 400 }
      );
    }

    // 1. Fetch user's custom OpenRouter API Key if configured
    const dbUser: any = await db.user.findUnique({
      where: { id: session.id },
      select: { openRouterApiKey: true, role: true },
    });

    let customApiKey: string | undefined = undefined;
    if (dbUser?.openRouterApiKey) {
      const decrypted = decryptText(dbUser.openRouterApiKey);
      if (decrypted) customApiKey = decrypted;
    }

    // Non-admin users MUST configure their own OpenRouter API key in profile to generate notes
    const isAdmin = session.role === "ADMIN" || dbUser?.role === "ADMIN";
    if (!isAdmin && !customApiKey) {
      return NextResponse.json(
        {
          error: "API key required. Please configure your OpenRouter API key in your Profile -> My API Keys before generating AI notes.",
          requiresApiKey: true,
        },
        { status: 403 }
      );
    }

    let transcript = "";
    let videoTitle = "";
    let videoId = `custom-${Date.now()}`;
    let finalYoutubeUrl = youtubeUrl || "";
    let meta = { channelId: "@velicham", channelName: "Velicham Knowledge", title: "" };

    if (youtubeUrl && youtubeUrl.trim().length > 0) {
      const extractedId = extractVideoId(youtubeUrl);
      if (extractedId) {
        videoId = extractedId;
        finalYoutubeUrl = `https://youtube.com/watch?v=${videoId}`;
      }

      // Try fetching real video metadata & transcript from YouTube
      meta = await fetchVideoMetadata(videoId);
      videoTitle = topicPrompt || meta.title || `YouTube Note (${videoId})`;

      try {
        transcript = await fetchTranscript(videoId);
      } catch (transcriptErr) {
        if (!topicPrompt || !topicPrompt.trim()) {
          throw new Error("Could not retrieve captions or transcript for this YouTube video. Please select a video with available captions or provide a custom topic prompt.");
        }
        transcript = `Video Title: ${videoTitle}\nTopic Request: ${topicPrompt}\nGenerate a comprehensive, high-quality knowledge note covering all key concepts, explanations, and takeaways for this topic.`;
      }
    } else {
      // Pure Topic Prompt (No YouTube URL provided)
      videoTitle = topicPrompt;
      transcript = `Subject & Study Topic: ${topicPrompt}\nDetailed Request: Create an exhaustive, structured, highly educational knowledge note on this topic. Explain all main arguments, sub-topics, historical/practical context, and key conclusions.`;
    }

    // 2. Generate structured note via AI
    console.log(`[USER NOTE GENERATION] Generating note for user ${session.email} ("${videoTitle}") using ${customApiKey ? "custom OpenRouter key" : "system key"}`);

    const generatedData = await generateNoteFromTranscript(
      transcript,
      videoTitle,
      customPrompt || topicPrompt,
      undefined,
      customApiKey
    );

    // 3. Auto-detect & Upsert Channel (author starts with @)
    let channelId: string | null = null;
    if (meta.channelName && meta.channelId) {
      const existingChannel = await db.channel.findFirst({
        where: {
          OR: [
            { youtubeChannelId: meta.channelId },
            { name: meta.channelName },
          ],
        },
      });

      if (existingChannel) {
        channelId = existingChannel.id;
      } else {
        const newChannel = await db.channel.create({
          data: {
            name: meta.channelName,
            youtubeChannelId: meta.channelId.startsWith("@") ? meta.channelId : `@${meta.channelId}`,
            description: `YouTube Channel: ${meta.channelName} (${meta.channelId})`,
          },
        });
        channelId = newChannel.id;
      }
    }

    // 4. Auto-detect & Upsert Topic
    let topicId: string | null = null;
    const suggestedTopic = generatedData.suggestedTopic || "General Knowledge";
    const topicSlug = slugify(suggestedTopic);

    const existingTopic = await db.topic.findUnique({ where: { slug: topicSlug } });
    if (existingTopic) {
      topicId = existingTopic.id;
    } else {
      const newTopic = await db.topic.create({
        data: {
          title: suggestedTopic,
          slug: topicSlug,
          description: `Topic covering ${suggestedTopic}`,
        },
      });
      topicId = newTopic.id;
    }

    // 5. Generate unique slug using slugify helper
    let baseSlug = slugify(generatedData.title);
    let slug = baseSlug;
    let count = 1;
    while (await db.note.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    // 6. Save to Database with Channel & Topic links
    const newNote = await db.note.create({
      data: {
        title: generatedData.title,
        slug,
        summary: generatedData.summary,
        content: generatedData.content,
        youtubeUrl: finalYoutubeUrl,
        videoId,
        timestamps: JSON.stringify(generatedData.timestamps || []),
        userCreatorId: session.id,
        authorId: channelId,
        topicId: topicId,
      },
    });

    return NextResponse.json({
      success: true,
      note: newNote,
    });
  } catch (error: any) {
    console.error("Generate note error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate note. Please verify your OpenRouter API key and try again." },
      { status: 500 }
    );
  }
}
