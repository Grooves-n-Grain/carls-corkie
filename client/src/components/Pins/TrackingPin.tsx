import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import { getSafeHttpUrl } from '../../utils/urlUtils';
import './TrackingPin.css';

interface TrackingPinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

// Status emoji and label mapping
const STATUS_MAP: Record<string, { emoji: string; label: string }> = {
  'pre-transit': { emoji: '📦', label: 'Preparing' },
  'in-transit': { emoji: '🚚', label: 'In Transit' },
  'out-for-delivery': { emoji: '🏃', label: 'Out for Delivery' },
  'delivered': { emoji: '✅', label: 'Delivered' },
  'exception': { emoji: '⚠️', label: 'Exception' },
  'unknown': { emoji: '❓', label: 'Unknown' },
};

// Format ETA for display
function formatEta(etaStr?: string): string | null {
  if (!etaStr) return null;
  try {
    const date = new Date(etaStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return etaStr; // Return raw string if parsing fails
  }
}

// Check if delivery is today
function isDeliveryToday(etaStr?: string): boolean {
  if (!etaStr) return false;
  try {
    const eta = new Date(etaStr);
    const today = new Date();
    return eta.toDateString() === today.toDateString();
  } catch {
    return false;
  }
}

// Get carrier tracking URL
function getTrackingUrl(carrier?: string, trackingNumber?: string, existingUrl?: string): string | null {
  if (existingUrl) return getSafeHttpUrl(existingUrl);
  if (!carrier || !trackingNumber) return null;
  
  const urlMap: Record<string, string> = {
    'ups': `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`,
    'fedex': `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`,
    'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`,
    'canada post': `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${encodeURIComponent(trackingNumber)}`,
    'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(trackingNumber)}`,
  };
  
  return getSafeHttpUrl(urlMap[carrier.toLowerCase()] || null);
}

export function TrackingPin({ pin, onToggleComplete, onDelete }: TrackingPinProps) {
  const rotation = getRotation(pin.id);
  const isCompleted = pin.status === 'completed';
  const isDelivered = pin.trackingStatus === 'delivered';
  const isToday = isDeliveryToday(pin.trackingEta);
  const isOutForDelivery = pin.trackingStatus === 'out-for-delivery';
  
  const statusInfo = STATUS_MAP[pin.trackingStatus || 'unknown'] || STATUS_MAP['unknown'];
  const formattedEta = formatEta(pin.trackingEta);
  const trackingUrl = getTrackingUrl(pin.trackingCarrier, pin.trackingNumber, pin.trackingUrl);

  return (
    <article
      className={`tracking-pin ${isCompleted || isDelivered ? 'tracking-pin--completed' : ''} ${isToday || isOutForDelivery ? 'tracking-pin--arriving' : ''}`}
      style={{ '--pin-rotation': `${rotation}deg` } as React.CSSProperties}
      aria-label={`Package: ${pin.title}`}
    >
      {/* Delete pushpin */}
      <button
        className="tracking-pin__delete-pin"
        onClick={onDelete}
        title="Remove from board"
        aria-label="Delete tracking"
      />

      {/* Content */}
      <div className="tracking-pin__content">
        {/* Checkbox */}
        <label className="tracking-pin__checkbox">
          <input
            type="checkbox"
            checked={isCompleted || isDelivered}
            onChange={onToggleComplete}
            aria-label={isCompleted ? 'Mark as active' : 'Mark as received'}
          />
          <span className="tracking-pin__checkbox-visual" />
        </label>

        {/* Text */}
        <div className="tracking-pin__text">
          <h3 className="tracking-pin__title">{pin.title}</h3>
          
          {/* Status badge */}
          <div className="tracking-pin__status">
            <span className="tracking-pin__status-emoji">{statusInfo.emoji}</span>
            <span className="tracking-pin__status-label">{statusInfo.label}</span>
          </div>
          
          {/* Carrier + tracking number */}
          <div className="tracking-pin__carrier">
            {pin.trackingCarrier && (
              <span className="tracking-pin__carrier-name">{pin.trackingCarrier}</span>
            )}
            {pin.trackingNumber && (
              <code className="tracking-pin__number">{pin.trackingNumber}</code>
            )}
          </div>
          
          {/* Location if available */}
          {pin.trackingLocation && (
            <p className="tracking-pin__location">📍 {pin.trackingLocation}</p>
          )}
          
          {/* ETA */}
          {formattedEta && !isDelivered && (
            <div className="tracking-pin__eta">
              <span className="tracking-pin__eta-label">ETA:</span>
              <span className="tracking-pin__eta-date">{formattedEta}</span>
            </div>
          )}
          
          {/* Description */}
          {pin.content && (
            <p className="tracking-pin__description">{pin.content}</p>
          )}
        </div>
      </div>

      {/* Track button */}
      {trackingUrl && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tracking-pin__track-link"
          title="Track on carrier website"
        >
          Track →
        </a>
      )}

      {/* Package icon */}
      <div className="tracking-pin__icon">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      </div>

      {/* Arriving today badge */}
      {(isToday || isOutForDelivery) && !isCompleted && !isDelivered && (
        <div className="tracking-pin__arriving-badge" title="Arriving today!">
          🎉
        </div>
      )}
    </article>
  );
}
