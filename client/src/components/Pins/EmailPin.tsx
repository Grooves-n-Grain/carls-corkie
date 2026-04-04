import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import { formatEmailDate } from '../../utils/dateUtils';
import { buildGmailMessageUrl, openSafeExternalUrl } from '../../utils/urlUtils';
import './EmailPin.css';

interface EmailPinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

// Format sender name (extract name or email)
function formatSender(from?: string): string {
  if (!from) return 'Unknown';
  // Extract name from "Name <email>" format
  const match = from.match(/^"?([^"<]+)"?\s*<?/);
  if (match) return match[1].trim();
  return from.split('@')[0];
}

export function EmailPin({ pin, onToggleComplete, onDelete }: EmailPinProps) {
  const rotation = getRotation(pin.id);
  const isCompleted = pin.status === 'completed';
  const sender = formatSender(pin.emailFrom);
  const dateDisplay = formatEmailDate(pin.emailDate);
  const emailUrl = buildGmailMessageUrl(pin.emailId);

  const handleOpenEmail = () => {
    openSafeExternalUrl(emailUrl);
  };

  return (
    <article
      className={`email-pin ${isCompleted ? 'email-pin--completed' : ''}`}
      style={{ '--pin-rotation': `${rotation}deg` } as React.CSSProperties}
      aria-label={`Email from ${sender}: ${pin.title}`}
    >
      {/* Delete pushpin */}
      <button
        className="email-pin__delete-pin"
        onClick={onDelete}
        title="Remove from board"
        aria-label="Delete email"
      />

      {/* Content */}
      <div className="email-pin__content">
        {/* Checkbox */}
        <label className="email-pin__checkbox">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={onToggleComplete}
            aria-label={isCompleted ? 'Mark as unread' : 'Mark as handled'}
          />
          <span className="email-pin__checkbox-visual" />
        </label>

        {/* Email details */}
        <div
          className="email-pin__details"
          onClick={handleOpenEmail}
          role={emailUrl ? 'button' : undefined}
          tabIndex={emailUrl ? 0 : -1}
        >
          <div className="email-pin__header">
            <span className="email-pin__sender">{sender}</span>
            <span className="email-pin__date">{dateDisplay}</span>
          </div>
          <h3 className="email-pin__subject">{pin.title}</h3>
          {pin.content && (
            <p className="email-pin__preview">{pin.content}</p>
          )}
        </div>
      </div>

      {/* Email icon */}
      <div className="email-pin__icon">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      </div>
    </article>
  );
}
