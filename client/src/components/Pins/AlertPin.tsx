import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import './AlertPin.css';

interface AlertPinProps {
  pin: Pin;
  onDismiss: () => void;
}

export function AlertPin({ pin, onDismiss }: AlertPinProps) {
  const rotation = getRotation(pin.id);
  const isDismissed = pin.status === 'dismissed';

  return (
    <article
      className={`alert-pin ${isDismissed ? 'alert-pin--dismissed' : ''}`}
      style={{ '--pin-rotation': `${rotation}deg` } as React.CSSProperties}
      aria-label={`Alert: ${pin.title}`}
      role="alert"
    >
      {/* Dismiss button */}
      <button
        className="alert-pin__dismiss"
        onClick={onDismiss}
        title="Dismiss"
        aria-label="Dismiss alert"
      >
        ×
      </button>

      {/* Alert icon */}
      <div className="alert-pin__icon">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>

      {/* Content */}
      <div className="alert-pin__content">
        <h3 className="alert-pin__title">{pin.title}</h3>
        {pin.content && (
          <p className="alert-pin__description">{pin.content}</p>
        )}
      </div>

      {/* Pulse ring animation */}
      <div className="alert-pin__pulse" aria-hidden="true" />
    </article>
  );
}
