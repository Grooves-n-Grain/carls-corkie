import { useState, FormEvent } from 'react';
import { TextInput, TextArea, SubmitButton } from './FormFields';

interface BriefingFormProps {
  apiUrl: string;
  onSuccess: () => void;
}

export function BriefingForm({ apiUrl, onSuccess }: BriefingFormProps) {
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
        type: 'briefing',
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
      console.error('Failed to create briefing:', err);
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
        placeholder="Briefing title"
        required
      />
      <TextArea
        label="Content"
        value={content}
        onChange={setContent}
        placeholder="Briefing content..."
        rows={8}
      />
      <SubmitButton isSubmitting={isSubmitting} disabled={!title.trim()} />
    </form>
  );
}
