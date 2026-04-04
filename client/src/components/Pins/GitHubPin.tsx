import type { Pin } from '../../types/pin';
import { buildGitHubRepoUrl, getSafeHttpUrl } from '../../utils/urlUtils';
import './GitHubPin.css';

interface GitHubPinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function GitHubPin({ pin, onToggleComplete, onDelete }: GitHubPinProps) {
  const isCompleted = pin.status === 'completed';
  const repoName = pin.repo || pin.title;
  const displayName = repoName.includes('/') ? repoName.split('/')[1] : repoName;
  
  // Build GitHub URL from repo name or use provided url
  const githubUrl = getSafeHttpUrl(pin.url) ?? buildGitHubRepoUrl(pin.repo);

  return (
    <article
      className={`github-pin ${isCompleted ? 'github-pin--completed' : ''}`}
      aria-label={`GitHub: ${pin.title}`}
    >
      {/* Terminal title bar */}
      <header className="github-pin__titlebar">
        <div className="github-pin__traffic-lights">
          <span className="github-pin__light github-pin__light--red" />
          <span className="github-pin__light github-pin__light--yellow" />
          <span className="github-pin__light github-pin__light--green" />
        </div>
        <span className="github-pin__path">~/{displayName}</span>
        <div className="github-pin__stats">
          <span className="github-pin__stat">★ {pin.stars ?? 0}</span>
          <span className="github-pin__stat">⑂ {pin.forks ?? 0}</span>
        </div>
      </header>

      {/* Terminal content */}
      <div className="github-pin__terminal">
        {/* Delete button */}
        <button
          className="github-pin__delete"
          onClick={onDelete}
          title="Delete"
          aria-label="Delete pin"
        >
          ×
        </button>

        {/* Command prompt */}
        <div className="github-pin__command">
          <span className="github-pin__prompt">$</span> cat README.md
        </div>

        {/* Project name */}
        <h3 className="github-pin__name">{displayName}</h3>

        {/* Description with green border */}
        {pin.content && (
          <blockquote className="github-pin__description">
            {pin.content}
          </blockquote>
        )}

        {/* Footer */}
        <footer className="github-pin__footer">
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="github-pin__link"
              onClick={(e) => e.stopPropagation()}
            >
              [ <svg className="github-pin__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg> View Code ]
            </a>
          ) : (
            <span className="github-pin__link github-pin__link--disabled">
              [ <svg className="github-pin__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg> View Code ]
            </span>
          )}
          <span className="github-pin__date">
            {new Date(pin.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
        </footer>

        {/* Complete toggle (subtle) */}
        <label className="github-pin__complete">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={onToggleComplete}
            aria-label={isCompleted ? 'Mark as active' : 'Mark as complete'}
          />
          <span className="github-pin__complete-visual" />
        </label>
      </div>
    </article>
  );
}
