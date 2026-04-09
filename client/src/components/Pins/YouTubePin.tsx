import { useState } from 'react';
import type { Pin } from '../../types/pin';
import { getSafeHttpUrl } from '../../utils/urlUtils';
import './YouTubePin.css';

interface YouTubeData {
  videoId: string;
  channelTitle?: string;
  description?: string;
  thumbnailUrl: string;
  publishedAt?: string;
  duration?: string;
  embedUrl?: string;
  sourceUrl?: string;
}

interface YouTubePinProps {
  pin: Pin & { youtubeData?: YouTubeData };
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function YouTubePin({ pin, onToggleComplete, onDelete }: YouTubePinProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompleted = pin.status === 'completed';
  const yt = pin.youtubeData;

  const thumbnailUrl = yt?.thumbnailUrl || (yt?.videoId ? `https://i.ytimg.com/vi/${yt.videoId}/hqdefault.jpg` : undefined);
  const embedUrl = yt?.embedUrl;
  const sourceUrl = getSafeHttpUrl(yt?.sourceUrl) ?? getSafeHttpUrl(pin.url);

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  const formattedDate = yt?.publishedAt
    ? new Date(yt.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date(pin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      {/* CARD VIEW */}
      <article
        className={`youtube-pin ${isCompleted ? 'youtube-pin--completed' : ''}`}
        onClick={handleExpand}
      >
        {/* Delete button */}
        <button
          className="youtube-pin__delete"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
          aria-label="Delete pin"
        >
          ×
        </button>

        {/* Thumbnail */}
        <div className="youtube-pin__thumbnail">
          {thumbnailUrl && (
            <img
              className="youtube-pin__thumbnail-img"
              src={thumbnailUrl}
              alt={pin.title}
              loading="lazy"
            />
          )}

          {/* Play overlay */}
          <div className="youtube-pin__play-overlay">
            <div className="youtube-pin__play-btn">
              <div className="youtube-pin__play-icon" />
            </div>
          </div>

          {/* Duration badge */}
          {yt?.duration && (
            <span className="youtube-pin__duration">{yt.duration}</span>
          )}
        </div>

        {/* Content */}
        <div className="youtube-pin__content">
          <h3 className="youtube-pin__title">{pin.title}</h3>
          <div className="youtube-pin__meta">
            {yt?.channelTitle && (
              <>
                <span className="youtube-pin__channel">{yt.channelTitle}</span>
                <span className="youtube-pin__meta-dot">·</span>
              </>
            )}
            <span className="youtube-pin__date">{formattedDate}</span>
          </div>
          {yt?.description && (
            <p className="youtube-pin__description">{yt.description}</p>
          )}
        </div>

        {/* Archive checkbox */}
        <label className="youtube-pin__archive" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={onToggleComplete}
            aria-label={isCompleted ? 'Unarchive' : 'Archive'}
          />
          <span className="youtube-pin__archive-visual" />
        </label>
      </article>

      {/* MODAL VIEW */}
      {isExpanded && (
        <div className="youtube-modal-overlay" onClick={handleCollapse}>
          <div className="youtube-modal" onClick={(e) => e.stopPropagation()}>
            <button className="youtube-modal__close" onClick={handleCollapse}>×</button>

            {/* Player or fallback */}
            {embedUrl ? (
              <div className="youtube-modal__player">
                <iframe
                  className="youtube-modal__iframe"
                  src={embedUrl}
                  title={pin.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="youtube-modal__fallback">
                {thumbnailUrl && (
                  <img
                    className="youtube-modal__fallback-thumb"
                    src={thumbnailUrl}
                    alt={pin.title}
                  />
                )}
                <span className="youtube-modal__fallback-msg">Inline playback unavailable</span>
                {sourceUrl && (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="youtube-modal__btn youtube-modal__btn--primary youtube-modal__fallback-link"
                  >
                    Open on YouTube
                  </a>
                )}
              </div>
            )}

            {/* Content */}
            <div className="youtube-modal__content">
              <h2 className="youtube-modal__title">{pin.title}</h2>

              <div className="youtube-modal__meta">
                {yt?.channelTitle && (
                  <>
                    <span className="youtube-modal__channel">{yt.channelTitle}</span>
                    <span className="youtube-pin__meta-dot">·</span>
                  </>
                )}
                <span>{formattedDate}</span>
                {yt?.duration && (
                  <>
                    <span className="youtube-pin__meta-dot">·</span>
                    <span>{yt.duration}</span>
                  </>
                )}
              </div>

              {yt?.description && (
                <p className="youtube-modal__description">{yt.description}</p>
              )}

              {/* Actions */}
              <div className="youtube-modal__actions">
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="youtube-modal__btn youtube-modal__btn--primary"
                  >
                    <svg className="youtube-modal__yt-icon" viewBox="0 0 24 18" fill="currentColor" aria-hidden="true">
                      <path d="M23.498 2.186a3.016 3.016 0 0 0-2.122-2.136C19.505 0 12 0 12 0S4.495 0 2.624.05A3.016 3.016 0 0 0 .502 2.186C0 4.07 0 9 0 9s0 4.93.502 6.814a3.016 3.016 0 0 0 2.122 2.136C4.495 18 12 18 12 18s7.505 0 9.376-.05a3.016 3.016 0 0 0 2.122-2.136C24 13.93 24 9 24 9s0-4.93-.502-6.814zM9.545 12.818V5.182L15.818 9l-6.273 3.818z"/>
                    </svg>
                    Open on YouTube
                  </a>
                ) : (
                  <span className="youtube-modal__btn">Open on YouTube</span>
                )}
                <button
                  className={`youtube-modal__btn ${isCompleted ? 'youtube-modal__btn--active' : ''}`}
                  onClick={onToggleComplete}
                >
                  {isCompleted ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
