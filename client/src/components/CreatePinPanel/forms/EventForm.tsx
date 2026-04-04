import { useState, FormEvent } from 'react';
import { TextInput, TextArea, DateTimeInput, SubmitButton } from './FormFields';

interface EventFormProps {
  apiUrl: string;
  onSuccess: () => void;
}

export function EventForm({ apiUrl, onSuccess }: EventFormProps) {
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDueAt('');
    setContent('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: 'event',
        title: title.trim(),
      };
      if (dueAt) payload.dueAt = new Date(dueAt).toISOString();
      if (content.trim()) payload.content = content.trim();

      const res = await fetch(`${apiUrl}/api/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Event"
        value={title}
        onChange={setTitle}
        placeholder="Event name"
        required
      />
      <DateTimeInput
        label="When"
        value={dueAt}
        onChange={setDueAt}
      />
      <TextArea
        label="Details"
        value={content}
        onChange={setContent}
        placeholder="Event details..."
      />
      <SubmitButton isSubmitting={isSubmitting} disabled={!title.trim()} />
    </form>
  );
}
