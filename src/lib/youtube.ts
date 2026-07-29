import { YoutubeTranscript } from 'youtube-transcript';

export function extractVideoId(url: string): string {
  try {
    const trimmed = url.trim();
    
    // Regex matching standard watch URLs, embed URLs, short URLs, and YouTube Shorts (/shorts/ID)
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }

    const parsedUrl = new URL(trimmed);
    if (parsedUrl.hostname.includes('youtube.com')) {
      if (parsedUrl.pathname.startsWith('/shorts/')) {
        return parsedUrl.pathname.split('/shorts/')[1].split('/')[0];
      }
      return parsedUrl.searchParams.get('v') || '';
    }
    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.slice(1).split('/')[0];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    return '';
  } catch (error) {
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
      return url.trim();
    }
    return '';
  }
}

export async function fetchTranscript(videoId: string): Promise<string> {
  const id = extractVideoId(videoId);
  if (!id) {
    throw new Error('Invalid YouTube video ID or URL');
  }

  // 1. Primary transcript fetch using youtube-transcript
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(id);
    if (transcript && transcript.length > 0) {
      return transcript
        .map((t: any) => {
          const minutes = Math.floor(t.offset / 1000 / 60);
          const seconds = Math.floor((t.offset / 1000) % 60);
          const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          return `[${timeStr}] ${t.text}`;
        })
        .join('\n');
    }
  } catch (error) {
    console.warn(`Primary transcript fetch failed for video ID ${id}, trying page metadata fallback:`, error instanceof Error ? error.message : error);
  }

  // 2. Fallback for Shorts / videos without auto-captions: extract title and description from YouTube page HTML
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (response.ok) {
      const html = await response.text();

      // Extract title
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : '';

      // Extract description
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/) || html.match(/<meta name="description" content="([^"]+)"/);
      const description = descMatch ? descMatch[1].replace(/\\n/g, '\n').trim() : '';

      if (title || description) {
        return `[00:00] Video Title: ${title}\n[00:01] Content & Summary: ${description}`;
      }
    }
  } catch (pageErr) {
    console.warn(`Page metadata extraction failed for ${id}:`, pageErr);
  }

  throw new Error('Could not retrieve captions or transcript for this video.');
}

export async function fetchPlaylistVideoIds(playlistUrl: string): Promise<string[]> {
  try {
    const url = new URL(playlistUrl);
    const listId = url.searchParams.get('list');
    
    if (!listId) {
      throw new Error('Invalid playlist URL: missing "list" parameter');
    }

    const response = await fetch(`https://www.youtube.com/playlist?list=${listId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist page: ${response.statusText}`);
    }

    const html = await response.text();
    const videoIdRegex = /"videoId":"([^"]+)"/g;
    const matches = [...html.matchAll(videoIdRegex)];
    
    const ids = matches.map(m => m[1]);
    
    // Remove duplicates
    const uniqueIds = [...new Set(ids)];
    return uniqueIds;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch playlist video IDs: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching playlist video IDs');
  }
}

export async function fetchVideoMetadata(videoId: string): Promise<{ channelId: string; channelName: string; title: string }> {
  try {
    const id = extractVideoId(videoId);
    if (!id) throw new Error('Invalid YouTube video ID or URL');

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
    const response = await fetch(oembedUrl);

    if (response.ok) {
      const data = await response.json();
      let channelId = data.author_name;
      if (data.author_url) {
        const handleMatch = data.author_url.match(/@([^/]+)/);
        if (handleMatch) channelId = `@${handleMatch[1]}`;
      }
      if (channelId && !channelId.startsWith('@')) {
        channelId = `@${channelId.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;
      }
      return {
        channelId: channelId || '@youtubechannel',
        channelName: data.author_name || 'YouTube Channel',
        title: data.title || `Video ${id}`
      };
    }

    return {
      channelId: 'UC_default',
      channelName: 'YouTube Channel',
      title: `YouTube Video (${id})`
    };
  } catch (error) {
    return {
      channelId: 'UC_default',
      channelName: 'YouTube Channel',
      title: `YouTube Video (${videoId})`
    };
  }
}
