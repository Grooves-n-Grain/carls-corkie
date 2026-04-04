import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import './EventPin.css';

interface EventPinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

// Format date for display
function formatEventDate(dateStr?: string): { date: string; time: string } | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeFormatted = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { date: dateFormatted, time: timeFormatted };
  } catch {
    return null;
  }
}

// Check if event is soon (within 24 hours)
function isEventSoon(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    const eventDate = new Date(dateStr);
    const now = new Date();
    const hoursUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 24;
  } catch {
    return false;
  }
}

// Check if event is past
function isEventPast(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    const eventDate = new Date(dateStr);
    return eventDate.getTime() < Date.now();
  } catch {
    return false;
  }
}

export function EventPin({ pin, onToggleComplete, onDelete }: EventPinProps) {
  const rotation = getRotation(pin.id);
  const isCompleted = pin.status === 'completed';
  const eventInfo = formatEventDate(pin.dueAt);
  const isSoon = isEventSoon(pin.dueAt);
  const isPast = isEventPast(pin.dueAt);

  return (
    <article
      className={`event-pin ${isCompleted ? 'event-pin--completed' : ''} ${isSoon ? 'event-pin--soon' : ''} ${isPast && !isCompleted ? 'event-pin--past' : ''}`}
      style={{ '--pin-rotation': `${rotation}deg` } as React.CSSProperties}
      aria-label={`Event: ${pin.title}`}
    >
      {/* Delete pushpin */}
      <button
        className="event-pin__delete-pin"
        onClick={onDelete}
        title="Remove from board"
        aria-label="Delete event"
      />

      {/* Content */}
      <div className="event-pin__content">
        {/* Checkbox */}
        <label className="event-pin__checkbox">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={onToggleComplete}
            aria-label={isCompleted ? 'Mark as active' : 'Mark as complete'}
          />
          <span className="event-pin__checkbox-visual" />
        </label>

        {/* Text */}
        <div className="event-pin__text">
          <h3 className="event-pin__title">{pin.title}</h3>
          {eventInfo && (
            <div className="event-pin__datetime">
              <span className="event-pin__date">{eventInfo.date}</span>
              <span className="event-pin__time">{eventInfo.time}</span>
            </div>
          )}
          {pin.content && (
            <p className="event-pin__description">{pin.content}</p>
          )}
        </div>
      </div>

      {/* Calendar icon */}
      <div className="event-pin__icon">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
        </svg>
      </div>

      {/* Soon indicator */}
      {isSoon && !isCompleted && (
        <div className="event-pin__soon-badge" title="Coming up soon!">
          ⏰
        </div>
      )}
    </article>
  );
}
