import { useState, FormEvent } from 'react';
import { TextInput, TextArea, SubmitButton } from './FormFields';

interface AlertFormProps {
  apiUrl: string;
  onSuccess: () => void;
}

export function AlertForm({ apiUrl, onSuccess }: AlertFormProps) {
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
