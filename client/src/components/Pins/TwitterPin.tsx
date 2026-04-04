import type { Pin } from '../../types/pin';
import { getSafeHttpUrl } from '../../utils/urlUtils';
import './TwitterPin.css';

interface TwitterPinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function TwitterPin({ pin, onToggleComplete, onDelete }: TwitterPinProps) {
  const isCompleted = pin.status === 'completed';
  const tweetUrl = getSafeHttpUrl(pin.url);

  return (
    <article
      className={`twitter-pin ${isCompleted ? 'twitter-pin--completed' : ''}`}
      aria-label={`Tweet by ${pin.title}`}
    >
      {/* Delete button */}
      <button
        className="twitter-pin__delete"
        onClick={onDelete}
        title="Delete"
        aria-label="Delete pin"
      >
        ×
      </button>

      {/* Author header */}
      <div className="twitter-pin__author">
        {/* Checkbox */}
        <label className="twitter-pin__complete">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={onToggleComplete}
            aria-label={isCompleted ? 'Mark as active' : 'Mark as complete'}
          />
          <span className="twitter-pin__complete-visual" />
        </label>

        {/* Twitter bird icon */}
        <svg className="twitter-pin__bird" viewBox="0 0 24 24" fill="#1da1f2" aria-hidden="true">
          <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/>
        </svg>

        <h3 className="twitter-pin__name">{pin.title}</h3>
      </div>

      {/* Tweet content */}
      {pin.content && (
        <p className="twitter-pin__text">{pin.content}</p>
      )}

      {/* Footer */}
      <footer className="twitter-pin__footer">
        {tweetUrl ? (
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="twitter-pin__link"
            onClick={(e) => e.stopPropagation()}
          >
            [ <svg className="twitter-pin__link-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/>
            </svg> View Tweet ]
          </a>
        ) : (
          <span className="twitter-pin__link twitter-pin__link--disabled">
            [ View Tweet ]
          </span>
        )}
        <span className="twitter-pin__date">
          {new Date(pin.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </footer>
    </article>
  );
}
