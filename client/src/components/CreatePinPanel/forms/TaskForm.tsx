import { useState, FormEvent } from 'react';
import { TextInput, TextArea, PrioritySelect, DateTimeInput, SubmitButton } from './FormFields';
import { apiFetch } from '../../../utils/apiFetch';

interface TaskFormProps {
  onSuccess: () => void;
}

export function TaskForm({ onSuccess }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState(2);
  const [dueAt, setDueAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority(2);
    setDueAt('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: 'task',
        title: title.trim(),
        priority,
      };
      if (content.trim()) payload.content = content.trim();
      if (dueAt) payload.dueAt = new Date(dueAt).toISOString();

      const res = await apiFetch('/api/pins', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
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
        placeholder="What needs to be done?"
        required
      />
      <TextArea
        label="Details"
        value={content}
        onChange={setContent}
        placeholder="Additional details..."
      />
      <PrioritySelect
        label="Priority"
        value={priority}
        onChange={setPriority}
      />
      <DateTimeInput
        label="Due Date"
        value={dueAt}
        onChange={setDueAt}
      />
      <SubmitButton isSubmitting={isSubmitting} disabled={!title.trim()} />
    </form>
  );
}
