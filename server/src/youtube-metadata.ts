// YouTube metadata extraction: yt-dlp primary, oEmbed fallback

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { YouTubeData } from '@corkboard/shared';
import { parseYouTubeUrl } from './youtube.js';

const execFileAsync = promisify(execFile);

interface YtDlpResult {
  id: string;
  title: string;
  channel?: string;
  uploader?: string;
  description?: string;
  thumbnail?: string;
  upload_date?: string;  // YYYYMMDD
  duration?: number;     // seconds
}

interface OEmbedResult {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatUploadDate(yyyymmdd: string): string {
  const year = yyyymmdd.slice(0, 4);
  const month = yyyymmdd.slice(4, 6);
  const day = yyyymmdd.slice(6, 8);
  return `${year}-${month}-${day}T00:00:00Z`;
}

async function fetchWithYtDlp(url: string): Promise<{ metadata: YouTubeData; title: string }> {
  const parsed = parseYouTubeUrl(url);

  const { stdout } = await execFileAsync('yt-dlp', [
    '--dump-single-json',
    '--skip-download',
    '--no-warnings',
    parsed.sourceUrl,
  ], { timeout: 30000 });

  const result: YtDlpResult = JSON.parse(stdout);

  return {
    title: result.title || 'YouTube Video',
    metadata: {
      videoId: parsed.videoId,
      thumbnailUrl: result.thumbnail || `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`,
      channelTitle: result.channel || result.uploader,
      description: result.description,
      publishedAt: result.upload_date ? formatUploadDate(result.upload_date) : undefined,
      duration: result.duration ? formatDuration(result.duration) : undefined,
      embedUrl: parsed.embedUrl,
      sourceUrl: parsed.sourceUrl,
    },
  };
}

async function fetchWithOEmbed(url: string): Promise<{ metadata: YouTubeData; title: string }> {
  const parsed = parseYouTubeUrl(url);
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.sourceUrl)}&format=json`;

  const response = await fetch(oembedUrl);
  if (!response.ok) {
    throw new Error(`oEmbed request failed: ${response.status}`);
  }

  const result: OEmbedResult = await response.json();

  return {
    title: result.title || 'YouTube Video',
    metadata: {
      videoId: parsed.videoId,
      thumbnailUrl: result.thumbnail_url || `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`,
      channelTitle: result.author_name,
      embedUrl: parsed.embedUrl,
      sourceUrl: parsed.sourceUrl,
    },
  };
}

export async function fetchYouTubeMetadata(url: string): Promise<YouTubeData & { title: string }> {
  try {
    const { metadata, title } = await fetchWithYtDlp(url);
    return { ...metadata, title };
  } catch {
    // yt-dlp unavailable or failed — fall back to oEmbed
    const { metadata, title } = await fetchWithOEmbed(url);
    return { ...metadata, title };
  }
}
