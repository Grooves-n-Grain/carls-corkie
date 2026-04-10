import { useState, FormEvent } from 'react';
import { TextInput, TextArea, SubmitButton } from './FormFields';
import { apiFetch } from '../../../utils/apiFetch';

interface AlertFormProps {
  onSuccess: () => void;
}

export function AlertForm({ onSuccess }: AlertFormProps) {
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
        type: 'alert',
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
      console.error('Failed to create alert:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Alert"
        value={title}
        onChange={setTitle}
        placeholder="What needs attention?"
        required
      />
      <TextArea
        label="Details"
        value={content}
        onChange={setContent}
        placeholder="More information..."
      />
      <SubmitButton isSubmitting={isSubmitting} disabled={!title.trim()} />
    </form>
  );
}
