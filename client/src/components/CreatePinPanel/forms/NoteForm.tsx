import { useState, FormEvent } from 'react';
import { TextInput, TextArea, SubmitButton } from './FormFields';
import { apiFetch } from '../../../utils/apiFetch';

interface NoteFormProps {
  onSuccess: () => void;
}

export function NoteForm({ onSuccess }: NoteFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: 'note',
        title: title.trim(),
      };
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
      console.error('Failed to create note:', err);
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
        placeholder="Note title"
        required
      />
      <TextArea
        label="Content"
        value={content}
        onChange={setContent}
        placeholder="Your note..."
        rows={5}
      />
      <SubmitButton isSubmitting={isSubmitting} disabled={!title.trim()} />
    </form>
  );
}
