import { useState, FormEvent } from 'react';
import { TextInput, TextArea, DateTimeInput, SubmitButton } from './FormFields';
import { apiFetch } from '../../../utils/apiFetch';

interface EmailFormProps {
  onSuccess: () => void;
}

export function EmailForm({ onSuccess }: EmailFormProps) {
  const [title, setTitle] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [emailDate, setEmailDate] = useState('');
  const [content, setContent] = useState('');
  const [emailId, setEmailId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setEmailFrom('');
    setEmailDate('');
    setContent('');
    setEmailId('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: 'email',
        title: title.trim(),
      };
      if (emailFrom.trim()) payload.emailFrom = emailFrom.trim();
      if (emailDate) payload.emailDate = new Date(emailDate).toISOString();
      if (content.trim()) payload.content = content.trim();
      if (emailId.trim()) payload.emailId = emailId.trim();

      const res = await apiFetch('/api/pins', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create email pin:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Subject"
        value={title}
        onChange={setTitle}
        placeholder="Email subject"
        required
      />
      <TextInput
        label="From"
        value={emailFrom}
        onChange={setEmailFrom}
        placeholder="sender@example.com"
      />
      <DateTimeInput
        label="Date"
        value={emailDate}
        onChange={setEmailDate}
      />
      <TextArea
        label="Summary"
        value={content}
        onChange={setContent}
        placeholder="Email summary..."
      />
      <TextInput
        label="Gmail ID"
        value={emailId}
        onChange={setEmailId}
        placeholder="Optional Gmail message ID"
      />
      <SubmitButton isSubmitting={isSubmitting} disabled={!title.trim()} />
    </form>
  );
}
