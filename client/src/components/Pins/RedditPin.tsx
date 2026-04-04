import type { Pin } from '../../types/pin';
import { getSafeHttpUrl } from '../../utils/urlUtils';
import './RedditPin.css';

interface RedditPinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function RedditPin({ pin, onToggleComplete, onDelete }: RedditPinProps) {
  const isCompleted = pin.status === 'completed';
  const redditUrl = getSafeHttpUrl(pin.url);

  // Extract subreddit from URL (e.g., /r/LocalLLaMA/)
  const subredditMatch = redditUrl ? new URL(redditUrl).pathname.match(/^\/r\/([^/]+)/) : null;
  const subreddit = subredditMatch ? `r/${subredditMatch[1]}` : null;

  return (
    <article
      className={`reddit-pin ${isCompleted ? 'reddit-pin--completed' : ''}`}
      aria-label={`Reddit: ${pin.title}`}
    >
      {/* Delete button */}
      <button
        className="reddit-pin__delete"
        onClick={onDelete}
        title="Delete"
        aria-label="Delete pin"
      >
        ×
      </button>

      <div className="reddit-pin__body">
        {/* Vote strip */}
        <div className="reddit-pin__vote-strip">
          {/* Upvote arrow SVG */}
          <svg className="reddit-pin__arrow reddit-pin__arrow--up" viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 4l-8 8h5v8h6v-8h5z" fill="#FF4500" />
          </svg>

          {/* Score dot */}
          <span className="reddit-pin__score">&bull;</span>

          {/* Downvote arrow SVG */}
          <svg className="reddit-pin__arrow reddit-pin__arrow--down" viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 20l8-8h-5V4H9v8H4z" fill="#787c7e" />
          </svg>

          {/* Spacer to push checkbox down */}
          <div style={{ flex: 1 }} />

          {/* Checkbox at bottom of strip */}
          <label className="reddit-pin__complete">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={onToggleComplete}
              aria-label={isCompleted ? 'Mark as active' : 'Mark as complete'}
            />
            <span className="reddit-pin__complete-visual" />
          </label>
        </div>

        {/* Content area */}
        <div className="reddit-pin__content-area">
          {/* Subreddit badge with Snoo icon */}
          {subreddit && (
            <div className="reddit-pin__subreddit-row">
              <svg className="reddit-pin__snoo" viewBox="0 0 20 20" width="22" height="22" aria-hidden="true">
                <circle cx="10" cy="10" r="10" fill="#FF4500"/>
                <circle cx="10" cy="10.5" r="5" fill="white"/>
                <circle cx="7.8" cy="9.5" r="1.1" fill="#FF4500"/>
                <circle cx="12.2" cy="9.5" r="1.1" fill="#FF4500"/>
                <path d="M7.5 12.5c0 0 1.2 1.5 2.5 1.5s2.5-1.5 2.5-1.5" fill="none" stroke="#FF4500" strokeWidth="0.9" strokeLinecap="round"/>
                <ellipse cx="5.2" cy="8" rx="1.4" ry="1.6" fill="white"/>
                <ellipse cx="14.8" cy="8" rx="1.4" ry="1.6" fill="white"/>
                <circle cx="10" cy="3.5" r="1.8" fill="white"/>
                <line x1="10" y1="3.5" x2="14.5" y2="1.5" stroke="white" strokeWidth="1.2"/>
                <circle cx="14.5" cy="1.5" r="1.2" fill="#FF4500"/>
              </svg>
              <span className="reddit-pin__subreddit">{subreddit}</span>
            </div>
          )}

          {/* Post title */}
          <h3 className="reddit-pin__title">{pin.title}</h3>

          {/* Post content preview (clamped to 10 lines) */}
          {pin.content && (
            <p className="reddit-pin__text">{pin.content}</p>
          )}

          {/* Footer */}
          <footer className="reddit-pin__footer">
            {redditUrl ? (
              <a
                href={redditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="reddit-pin__link"
                onClick={(e) => e.stopPropagation()}
              >
                [ View on Reddit ]
              </a>
            ) : (
              <span className="reddit-pin__link reddit-pin__link--disabled">
                [ View on Reddit ]
              </span>
            )}
            <span className="reddit-pin__date">
              {new Date(pin.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </footer>
        </div>
      </div>
    </article>
  );
}
