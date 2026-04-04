import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import { getSafeHostname, getSafeHttpUrl, openSafeExternalUrl } from '../../utils/urlUtils';
import './LinkPin.css';

interface LinkPinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function LinkPin({ pin, onToggleComplete, onDelete }: LinkPinProps) {
  const rotation = getRotation(pin.id);
  const safeUrl = getSafeHttpUrl(pin.url || pin.content);
  const domain = getSafeHostname(safeUrl) ?? 'Invalid link';
  const isCompleted = pin.status === 'completed';

  const handleClick = () => {
    openSafeExternalUrl(safeUrl);
  };

  return (
    <article
      className={`link-pin ${isCompleted ? 'link-pin--completed' : ''}`}
      style={{ '--pin-rotation': `${rotation}deg` } as React.CSSProperties}
      aria-label={`Link: ${pin.title}`}
    >
      {/* Delete pushpin */}
      <button
        className="link-pin__delete-pin"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Remove from board"
        aria-label="Delete link"
      />

      {/* Checkbox */}
      <label className="link-pin__checkbox" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={onToggleComplete}
          aria-label={isCompleted ? 'Mark as active' : 'Mark as complete'}
        />
        <span className="link-pin__checkbox-visual" />
      </label>

      {/* Clickable card area */}
      <div
        className="link-pin__clickable"
        onClick={handleClick}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && safeUrl) {
            event.preventDefault();
            handleClick();
          }
        }}
        role={safeUrl ? 'link' : undefined}
        tabIndex={safeUrl ? 0 : -1}
      >
        {/* Link icon */}
        <div className="link-pin__icon">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </div>

        {/* Content */}
        <div className="link-pin__content">
          <h3 className="link-pin__title">{pin.title}</h3>
          <p className="link-pin__domain">{domain}</p>
        </div>

        {/* External link indicator */}
        <div className="link-pin__external">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
          </svg>
        </div>
      </div>
    </article>
  );
}
