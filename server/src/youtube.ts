// YouTube URL normalization and video ID extraction

export interface ParsedYouTubeUrl {
  videoId: string;
  sourceUrl: string;
  embedUrl: string;
}

const YOUTUBE_PATTERNS: Array<{ regex: RegExp; idGroup: number }> = [
  // https://www.youtube.com/watch?v=VIDEO_ID
  { regex: /^https?:\/\/(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/, idGroup: 1 },
  // https://youtu.be/VIDEO_ID
  { regex: /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/, idGroup: 1 },
  // https://www.youtube.com/shorts/VIDEO_ID
  { regex: /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, idGroup: 1 },
  // https://www.youtube.com/live/VIDEO_ID
  { regex: /^https?:\/\/(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/, idGroup: 1 },
  // https://www.youtube.com/embed/VIDEO_ID
  { regex: /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, idGroup: 1 },
];

export function parseYouTubeUrl(url: string): ParsedYouTubeUrl {
  for (const { regex, idGroup } of YOUTUBE_PATTERNS) {
    const match = url.match(regex);
    if (match) {
      const videoId = match[idGroup];
      return {
        videoId,
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
  }

  throw new Error(`Unsupported YouTube URL: ${url}`);
}

export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_PATTERNS.some(({ regex }) => regex.test(url));
}
