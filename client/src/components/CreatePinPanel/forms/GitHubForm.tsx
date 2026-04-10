import { useState, FormEvent } from 'react';
import { TextInput, TextArea, UrlInput, NumberInput, SubmitButton } from './FormFields';
import { apiFetch } from '../../../utils/apiFetch';

interface GitHubFormProps {
  onSuccess: () => void;
}

export function GitHubForm({ onSuccess }: GitHubFormProps) {
  const [title, setTitle] = useState('');
  const [repo, setRepo] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [stars, setStars] = useState('');
  const [forks, setForks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setRepo('');
    setUrl('');
    setContent('');
    setStars('');
    setForks('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: 'github',
        title: title.trim(),
      };
      if (repo.trim()) payload.repo = repo.trim();
      if (url.trim()) payload.url = url.trim();
      if (content.trim()) payload.content = content.trim();
      if (stars) payload.stars = parseInt(stars, 10);
      if (forks) payload.forks = parseInt(forks, 10);

      const res = await apiFetch('/api/pins', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create github pin:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Title"
        value={title}
        onChange={setTitle}
        placeholder="Repo or PR name"
        required
      />
      <TextInput
        label="Repository"
        value={repo}
        onChange={setRepo}
        placeholder="owner/repo"
      />
      <UrlInput
        label="URL"
        value={url}
        onChange={setUrl}
        placeholder="https://github.com/..."
      />
      <TextArea
        label="Description"
        value={content}
        onChange={setContent}
        placeholder="About this repo..."
      />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <NumberInput
          label="Stars"
          value={stars}
          onChange={setStars}
          placeholder="0"
        />
        <NumberInput
          label="Forks"
          value={forks}
          onChange={setForks}
          placeholder="0"
        />
      </div>
      <SubmitButton isSubmitting={isSubmitting} disabled={!title.trim()} />
    </form>
  );
}
