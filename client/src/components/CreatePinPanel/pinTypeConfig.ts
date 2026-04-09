import type { PinType } from '../../../../shared/types';

export interface PinTypeConfig {
  value: PinType;
  label: string;
  emoji: string;
  fields: FieldConfig[];
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'datetime' | 'priority' | 'number' | 'url';
  required?: boolean;
  placeholder?: string;
}

export const PIN_TYPE_CONFIG: PinTypeConfig[] = [
  {
    value: 'task',
    label: 'Task',
    emoji: '✓',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'What needs to be done?' },
      { name: 'content', label: 'Details', type: 'textarea', placeholder: 'Additional details...' },
      { name: 'priority', label: 'Priority', type: 'priority' },
      { name: 'dueAt', label: 'Due Date', type: 'datetime' },
    ],
  },
  {
    value: 'note',
    label: 'Note',
    emoji: '📝',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Note title' },
      { name: 'content', label: 'Content', type: 'textarea', placeholder: 'Your note...' },
    ],
  },
  {
    value: 'link',
    label: 'Link',
    emoji: '🔗',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Link title' },
      { name: 'url', label: 'URL', type: 'url', placeholder: 'https://...' },
      { name: 'content', label: 'Description', type: 'textarea', placeholder: 'What is this link?' },
    ],
  },
  {
    value: 'event',
    label: 'Event',
    emoji: '📅',
    fields: [
      { name: 'title', label: 'Event', type: 'text', required: true, placeholder: 'Event name' },
      { name: 'dueAt', label: 'When', type: 'datetime' },
      { name: 'content', label: 'Details', type: 'textarea', placeholder: 'Event details...' },
    ],
  },
  {
    value: 'alert',
    label: 'Alert',
    emoji: '⚠️',
    fields: [
      { name: 'title', label: 'Alert', type: 'text', required: true, placeholder: 'What needs attention?' },
      { name: 'content', label: 'Details', type: 'textarea', placeholder: 'More information...' },
    ],
  },
  {
    value: 'email',
    label: 'Email',
    emoji: '✉️',
    fields: [
      { name: 'title', label: 'Subject', type: 'text', required: true, placeholder: 'Email subject' },
      { name: 'emailFrom', label: 'From', type: 'text', placeholder: 'sender@example.com' },
      { name: 'emailDate', label: 'Date', type: 'datetime' },
      { name: 'content', label: 'Summary', type: 'textarea', placeholder: 'Email summary...' },
      { name: 'emailId', label: 'Gmail ID', type: 'text', placeholder: 'Optional Gmail message ID' },
    ],
  },
  {
    value: 'opportunity',
    label: 'Opportunity',
    emoji: '💡',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Interesting but not urgent' },
      { name: 'emailFrom', label: 'From', type: 'text', placeholder: 'sender@example.com' },
      { name: 'emailDate', label: 'Date', type: 'datetime' },
      { name: 'content', label: 'Notes', type: 'textarea', placeholder: 'Why this matters later...' },
      { name: 'emailId', label: 'Gmail ID', type: 'text', placeholder: 'Optional Gmail message ID' },
    ],
  },
  {
    value: 'briefing',
    label: 'Briefing',
    emoji: '📋',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Briefing title' },
      { name: 'content', label: 'Content', type: 'textarea', placeholder: 'Briefing content...' },
    ],
  },
  {
    value: 'github',
    label: 'GitHub',
    emoji: '🐙',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Repo or PR name' },
      { name: 'repo', label: 'Repository', type: 'text', placeholder: 'owner/repo' },
      { name: 'url', label: 'URL', type: 'url', placeholder: 'https://github.com/...' },
      { name: 'content', label: 'Description', type: 'textarea', placeholder: 'About this repo...' },
      { name: 'stars', label: 'Stars', type: 'number', placeholder: '0' },
      { name: 'forks', label: 'Forks', type: 'number', placeholder: '0' },
    ],
  },
  {
    value: 'tracking',
    label: 'Package',
    emoji: '📦',
    fields: [
      { name: 'title', label: 'Item', type: 'text', required: true, placeholder: "What's being shipped?" },
      { name: 'trackingNumber', label: 'Tracking #', type: 'text', required: true, placeholder: '1Z999AA10123456784' },
      { name: 'trackingCarrier', label: 'Carrier', type: 'text', placeholder: 'UPS, FedEx, USPS...' },
      { name: 'trackingEta', label: 'ETA', type: 'datetime' },
      { name: 'content', label: 'Notes', type: 'textarea', placeholder: 'Order details...' },
    ],
  },
  {
    value: 'twitter',
    label: 'Twitter',
    emoji: '🐦',
    fields: [
      { name: 'title', label: 'Author', type: 'text', required: true, placeholder: 'Display name' },
      { name: 'content', label: 'Tweet', type: 'textarea', required: true, placeholder: 'Tweet text...' },
      { name: 'url', label: 'URL', type: 'url', placeholder: 'https://x.com/...' },
    ],
  },
  {
    value: 'reddit',
    label: 'Reddit',
    emoji: '🔶',
    fields: [
      { name: 'title', label: 'Subreddit', type: 'text', required: true, placeholder: 'r/SubredditName' },
      { name: 'content', label: 'Content', type: 'textarea', placeholder: 'Post content...' },
      { name: 'url', label: 'URL', type: 'url', placeholder: 'https://reddit.com/...' },
    ],
  },
  {
    value: 'youtube',
    label: 'YouTube',
    emoji: '▶️',
    fields: [
      { name: 'url', label: 'YouTube URL', type: 'url', required: true, placeholder: 'https://youtube.com/watch?v=...' },
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Optional — auto-detected' },
    ],
  },
];

export function getPinTypeConfig(type: PinType): PinTypeConfig | undefined {
  return PIN_TYPE_CONFIG.find(config => config.value === type);
}
