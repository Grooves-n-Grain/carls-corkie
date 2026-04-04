import { useState } from 'react';
import type { Pin } from '../../types/pin';
import { getSafeHostname, getSafeHttpUrl } from '../../utils/urlUtils';
import './ArticlePin.css';

interface ArticleData {
  url: string;
  source: string;
  readTime?: string;
  tldr: string;
  bullets: string[];
  tags?: string[];
}

interface ArticlePinProps {
  pin: Pin & { articleData?: ArticleData };
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function ArticlePin({ pin, onToggleComplete, onDelete }: ArticlePinProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompleted = pin.status === 'completed';
  const article = pin.articleData;

  // Derive fallback source domain from pin.url
  const fallbackSource = getSafeHostname(pin.url) || 'Article';

  const source = article?.source || fallbackSource;
  const tldr = article?.tldr || pin.content || '';
  const bullets = article?.bullets || [];
  const articleUrl = getSafeHttpUrl(article?.url) ?? getSafeHttpUrl(pin.url);

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  return (
    <>
      {/* CARD VIEW */}
      <article
        className={`article-pin ${isCompleted ? 'article-pin--archived' : ''}`}
        onClick={handleExpand}
      >
        {/* Browser title bar */}
        <header className="article-pin__titlebar">
          <div className="article-pin__traffic-lights">
            <span className="article-pin__light article-pin__light--red" />
            <span className="article-pin__light article-pin__light--yellow" />
            <span className="article-pin__light article-pin__light--green" />
          </div>
          <span className="article-pin__tab-title">{pin.title}</span>
          <button
            className="article-pin__close"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
            aria-label="Delete pin"
          >
            ×
          </button>
        </header>

        {/* URL bar */}
        <div className="article-pin__urlbar">
          <span className="article-pin__lock">🔒</span>
          <span className="article-pin__domain">{source}</span>
        </div>

        {/* Page content */}
        <div className="article-pin__page">
          <h3 className="article-pin__headline">{pin.title}</h3>

          {tldr && (
            <blockquote className="article-pin__summary">
              {tldr}
            </blockquote>
          )}

          {bullets.length > 0 && (
            <ul className="article-pin__points">
              {bullets.slice(0, 2).map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          )}

          <footer className="article-pin__footer">
            <div className="article-pin__meta">
              {article?.readTime && <span>☕ {article.readTime}</span>}
              <time>
                {new Date(pin.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </time>
            </div>
            <button className="article-pin__cta">Open →</button>
          </footer>
        </div>

        {/* Archive checkbox */}
        <label className="article-pin__archive" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={onToggleComplete}
            aria-label={isCompleted ? 'Unarchive' : 'Archive'}
          />
          <span className="article-pin__archive-visual" />
        </label>
      </article>

      {/* MODAL VIEW */}
      {isExpanded && (
        <div className="article-modal-overlay" onClick={handleCollapse}>
          <div className="article-modal" onClick={(e) => e.stopPropagation()}>
            {/* Browser title bar */}
            <header className="article-modal__titlebar">
              <div className="article-modal__traffic-lights">
                <span className="article-modal__light article-modal__light--red" />
                <span className="article-modal__light article-modal__light--yellow" />
                <span className="article-modal__light article-modal__light--green" />
              </div>
              <span className="article-modal__tab-title">{pin.title}</span>
              <button className="article-modal__close" onClick={handleCollapse}>×</button>
            </header>

            {/* URL bar */}
            <div className="article-modal__urlbar">
              <span className="article-modal__lock">🔒</span>
              <span className="article-modal__domain">{source}</span>
            </div>

            {/* Content */}
            <div className="article-modal__content">
              {/* Meta row */}
              <div className="article-modal__meta">
                {article?.readTime && (
                  <span className="article-modal__readtime">☕ {article.readTime} read</span>
                )}
              </div>

              {/* Headline */}
              <h1 className="article-modal__headline">{pin.title}</h1>

              {/* Divider */}
              <hr className="article-modal__divider" />

              {/* TL;DR */}
              {tldr && (
                <section className="article-modal__section">
                  <h4 className="article-modal__section-title">The Gist</h4>
                  <p className="article-modal__tldr">{tldr}</p>
                </section>
              )}

              {/* Key Points */}
              {bullets.length > 0 && (
                <section className="article-modal__section">
                  <h4 className="article-modal__section-title">Key Points</h4>
                  <ul className="article-modal__bullets">
                    {bullets.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Tags */}
              {article?.tags && article.tags.length > 0 && (
                <div className="article-modal__tags">
                  {article.tags.map((tag) => (
                    <span key={tag} className="article-modal__tag">{tag}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="article-modal__actions">
                {articleUrl ? (
                  <a
                    href={articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="article-modal__btn article-modal__btn--primary"
                  >
                    Open Full Article ↗
                  </a>
                ) : (
                  <span className="article-modal__btn">
                    Open Full Article
                  </span>
                )}
                <button
                  className={`article-modal__btn ${isCompleted ? 'article-modal__btn--active' : ''}`}
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
