import { useState, FormEvent } from 'react';
import { TextInput, TextArea, UrlInput, SubmitButton } from './FormFields';
import { apiFetch } from '../../../utils/apiFetch';

interface YouTubeFormProps {
  onSuccess: () => void;
}

const YOUTUBE_PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
];

function extractVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function YouTubeForm({ onSuccess }: YouTubeFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const videoId = extractVideoId(url);

  const resetForm = () => {
    setUrl('');
    setTitle('');
    setDescription('');
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!videoId) {
      setError('Could not extract video ID. Use a youtube.com or youtu.be URL.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const payload: Record<string, unknown> = {
        type: 'youtube',
        title: title.trim() || 'YouTube Video',
        url: canonicalUrl,
        youtubeData: {
          videoId,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          sourceUrl: canonicalUrl,
          ...(description.trim() ? { description: description.trim() } : {}),
        },
      };

      const res = await apiFetch('/api/pins', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create pin');
      }
    } catch (err) {
      console.error('Failed to create YouTube pin:', err);
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <UrlInput
        label="YouTube URL"
        value={url}
        onChange={(v) => { setUrl(v); setError(''); }}
        placeholder="https://youtube.com/watch?v=... or youtu.be/..."
      />
      {videoId && (
        <div style={{ margin: '0.5rem 0', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', background: '#1a1a1a' }}>
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt="Video thumbnail"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
      <TextInput
        label="Title"
        value={title}
        onChange={setTitle}
        placeholder="Optional — defaults to 'YouTube Video'"
      />
      <TextArea
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="What's this video about?"
        rows={2}
      />
      {error && (
        <div style={{ color: '#ff4444', fontSize: '0.82rem', margin: '0.5rem 0' }}>{error}</div>
      )}
      <SubmitButton isSubmitting={isSubmitting} disabled={!url.trim()} />
    </form>
  );
}
