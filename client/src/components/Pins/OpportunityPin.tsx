import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import { formatEmailDate } from '../../utils/dateUtils';
import { buildGmailMessageUrl, openSafeExternalUrl } from '../../utils/urlUtils';
import './OpportunityPin.css';

interface OpportunityPinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

function formatSender(from?: string): string {
  if (!from) return 'Opportunity';
  const match = from.match(/^"?([^"<]+)"?\s*<?/);
  if (match) return match[1].trim();
  return from.split('@')[0];
}

export function OpportunityPin({ pin, onToggleComplete, onDelete }: OpportunityPinProps) {
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
      className={`opportunity-pin ${isCompleted ? 'opportunity-pin--completed' : ''}`}
      style={{ '--pin-rotation': `${rotation}deg` } as React.CSSProperties}
      aria-label={`Opportunity: ${pin.title}`}
    >
      <button className="opportunity-pin__delete-pin" onClick={onDelete} title="Remove from board" aria-label="Delete opportunity" />
      <div className="opportunity-pin__badge">LATER / LEVERAGE</div>
      <div className="opportunity-pin__content">
        <label className="opportunity-pin__checkbox">
          <input type="checkbox" checked={isCompleted} onChange={onToggleComplete} aria-label={isCompleted ? 'Mark as unread' : 'Mark as reviewed'} />
          <span className="opportunity-pin__checkbox-visual" />
        </label>
        <div
          className="opportunity-pin__details"
          onClick={handleOpenEmail}
          role={emailUrl ? 'button' : undefined}
          tabIndex={emailUrl ? 0 : -1}
        >
          <div className="opportunity-pin__header">
            <span className="opportunity-pin__sender">{sender}</span>
            <span className="opportunity-pin__date">{dateDisplay}</span>
          </div>
          <h3 className="opportunity-pin__subject">{pin.title}</h3>
          {pin.content && <p className="opportunity-pin__preview">{pin.content}</p>}
        </div>
      </div>
      <div className="opportunity-pin__icon">💡</div>
    </article>
  );
}
