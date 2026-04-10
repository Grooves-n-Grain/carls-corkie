import { useState, FormEvent } from 'react';
import { TextInput, TextArea, UrlInput, SubmitButton } from './FormFields';
import { apiFetch } from '../../../utils/apiFetch';

interface LinkFormProps {
  onSuccess: () => void;
}

export function LinkForm({ onSuccess }: LinkFormProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setContent('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: 'link',
        title: title.trim(),
      };
      if (url.trim()) payload.url = url.trim();
      if (content.trim()) payload.content = content.trim();

      const res = await apiFetch('/api/pins', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create link:', err);
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
        placeholder="Link title"
        required
      />
      <UrlInput
        label="URL"
        value={url}
        onChange={setUrl}
        placeholder="https://..."
      />
      <TextArea
        label="Description"
        value={content}
        onChange={setContent}
        placeholder="What is this link?"
      />
      <SubmitButton isSubmitting={isSubmitting} disabled={!title.trim()} />
    </form>
  );
}
