import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Pin } from '../../types/pin';
import { getRotation } from '../../utils/pinUtils';
import { IdeaDetailModal } from './IdeaDetailModal';
import './IdeaPin.css';

interface IdeaPinProps {
  pin: Pin;
  onToggleComplete: () => void;
  onDelete: () => void;
}

const VERDICT_MAP = {
  hot:  { emoji: '🔥', label: 'High Potential', className: 'idea-pin__verdict--hot' },
  warm: { emoji: '💡', label: 'Worth Exploring', className: 'idea-pin__verdict--warm' },
  cold: { emoji: '🧊', label: 'Cool But Later', className: 'idea-pin__verdict--cold' },
  pass: { emoji: '🗑️', label: 'Pass', className: 'idea-pin__verdict--pass' },
} as const;

function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorClass = value >= 7 ? 'score--high' : value >= 4 ? 'score--mid' : 'score--low';
  return (
    <div className="idea-pin__score-row">
      <span className="idea-pin__score-label">{label}</span>
      <div className="idea-pin__score-track">
        <div className={`idea-pin__score-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="idea-pin__score-value">{value}/{max}</span>
    </div>
  );
}

export function IdeaPin({ pin, onToggleComplete, onDelete }: IdeaPinProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isCompleted = pin.status === 'completed';
  const rotation = getRotation(pin.id);
  const verdict = pin.ideaVerdict ? VERDICT_MAP[pin.ideaVerdict] : null;
  const scores = pin.ideaScores;

  // Parse one-liner from content if available
  let oneLiner: string | undefined;
  try {
    if (pin.content) {
      const parsed = JSON.parse(pin.content);
      oneLiner = parsed.oneLiner;
    }
  } catch { /* not JSON, that's fine */ }

  const hasDetailData = !!pin.content;

  return (
    <>
      <article
        className={`idea-pin ${isCompleted ? 'idea-pin--completed' : ''} ${hasDetailData ? 'idea-pin--clickable' : ''}`}
        style={{ '--pin-rotation': `${rotation}deg` } as React.CSSProperties}
        aria-label={`Idea: ${pin.title}`}
        onClick={hasDetailData ? () => setModalOpen(true) : undefined}
      >
        {/* Lab flask header */}
        <header className="idea-pin__header">
          <span className="idea-pin__flask">🧪</span>
          <span className="idea-pin__header-label">IDEA INCUBATOR</span>
          <button
            className="idea-pin__delete"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
            aria-label="Delete idea"
          >
            ×
          </button>
        </header>

        <div className="idea-pin__body">
          {/* Title */}
          <h3 className="idea-pin__title">{pin.title}</h3>

          {/* One-liner */}
          {oneLiner && (
            <p className="idea-pin__oneliner">{oneLiner}</p>
          )}

          {/* Verdict badge */}
          {verdict && (
            <div className={`idea-pin__verdict ${verdict.className}`}>
              <span className="idea-pin__verdict-emoji">{verdict.emoji}</span>
              <span className="idea-pin__verdict-label">{verdict.label}</span>
            </div>
          )}

          {/* Score bars */}
          {scores && (
            <div className="idea-pin__scores">
              {scores.viability != null && <ScoreBar label="Viability" value={scores.viability} />}
              {scores.alignment != null && <ScoreBar label="Alignment" value={scores.alignment} />}
              {scores.effort != null && <ScoreBar label="Effort" value={scores.effort} />}
              {scores.competition != null && <ScoreBar label="Market Gap" value={scores.competition} />}
              {scores.marketSignal != null && <ScoreBar label="Demand" value={scores.marketSignal} />}
            </div>
          )}

          {/* Meta line */}
          <div className="idea-pin__meta">
            {pin.ideaCompetitors != null && (
              <span className="idea-pin__meta-item">
                {pin.ideaCompetitors} competitor{pin.ideaCompetitors !== 1 ? 's' : ''} found
              </span>
            )}
            {pin.ideaEffortEstimate && (
              <span className="idea-pin__meta-item">
                MVP: {pin.ideaEffortEstimate}
              </span>
            )}
          </div>

          {/* Research summary (brief) */}
          {pin.ideaResearchSummary && (
            <p className="idea-pin__summary">{pin.ideaResearchSummary}</p>
          )}

          {/* Footer */}
          <footer className="idea-pin__footer">
            <label className="idea-pin__archive" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={onToggleComplete}
                aria-label={isCompleted ? 'Reactivate idea' : 'Archive idea'}
              />
              <span className="idea-pin__archive-visual" />
              <span className="idea-pin__archive-label">
                {isCompleted ? 'Archived' : 'Archive'}
              </span>
            </label>
            {hasDetailData && (
              <span className="idea-pin__view-detail">View details →</span>
            )}
            <span className="idea-pin__date">
              {new Date(pin.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </footer>
        </div>
      </article>

      {/* Detail Modal */}
      {modalOpen && createPortal(
        <IdeaDetailModal pin={pin} onClose={() => setModalOpen(false)} />,
        document.body
      )}
    </>
  );
}
