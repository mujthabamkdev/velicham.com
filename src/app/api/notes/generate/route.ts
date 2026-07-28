import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptText } from "@/lib/encryption";
import { generateNoteFromTranscript } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Please log in to generate AI notes" }, { status: 401 });
    }

    const body = await req.json();
    const { youtubeUrl, topicPrompt } = body;

    if (!youtubeUrl && !topicPrompt) {
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
          error: "API key required. Please configure your OpenRouter API key in your Profile page before generating AI notes.",
          requiresApiKey: true,
        },
        { status: 403 }
      );
    }

    let transcript = "";
    let videoTitle = "";
    let videoId = `custom-${Date.now()}`;
    let finalYoutubeUrl = youtubeUrl || "https://youtube.com";

    if (youtubeUrl) {
      // Extract videoId from YouTube URL
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = youtubeUrl.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      }
      videoTitle = topicPrompt || `YouTube Note (${videoId})`;
      transcript = `Video ID: ${videoId}. Content topic: ${videoTitle}. ${topicPrompt || ""}`;
    } else {
      videoTitle = topicPrompt;
      transcript = `Detailed study topic: ${topicPrompt}. Explain concepts clearly with structured headings and key takeaways.`;
    }

    // 2. Generate structured note via AI
    console.log(`[USER NOTE GENERATION] Generating note for user ${session.email} using ${customApiKey ? "custom user OpenRouter key" : "system fallback key"}`);
    
    const generatedData = await generateNoteFromTranscript(
      transcript,
      videoTitle,
      undefined,
      undefined,
      customApiKey
    );

    // 3. Generate unique slug
    let baseSlug = generatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    if (!baseSlug) baseSlug = `note-${Date.now()}`;

    let slug = baseSlug;
    let count = 1;
    while (await db.note.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    // 4. Save to Database
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
