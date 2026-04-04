import { useEffect, useCallback } from 'react';
import type { Pin } from '../../types/pin';
import { getSafeHttpUrl } from '../../utils/urlUtils';
import './IdeaDetailModal.css';

interface IdeaDetailModalProps {
  pin: Pin;
  onClose: () => void;
}

interface IdeaReport {
  oneLiner?: string;
  competitors?: Array<{
    name: string;
    url?: string;
    description: string;
    gap?: string;
  }>;
  marketEvidence?: string[];
  technicalNotes?: string;
  revenueModel?: string;
  recommendation?: string;
}

const VERDICT_MAP = {
  hot:  { emoji: '🔥', label: 'High Potential', className: 'idea-modal__verdict--hot' },
  warm: { emoji: '💡', label: 'Worth Exploring', className: 'idea-modal__verdict--warm' },
  cold: { emoji: '🧊', label: 'Cool But Later', className: 'idea-modal__verdict--cold' },
  pass: { emoji: '🗑️', label: 'Pass', className: 'idea-modal__verdict--pass' },
} as const;

function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorClass = value >= 7 ? 'modal-score--high' : value >= 4 ? 'modal-score--mid' : 'modal-score--low';
  return (
    <div className="idea-modal__score-row">
      <span className="idea-modal__score-label">{label}</span>
      <div className="idea-modal__score-track">
        <div className={`idea-modal__score-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="idea-modal__score-value">{value}/{max}</span>
    </div>
  );
}

function parseReport(content?: string): IdeaReport | null {
  if (!content) return null;
  try {
    return JSON.parse(content) as IdeaReport;
  } catch {
    return null;
  }
}

export function IdeaDetailModal({ pin, onClose }: IdeaDetailModalProps) {
  const verdict = pin.ideaVerdict ? VERDICT_MAP[pin.ideaVerdict] : null;
  const scores = pin.ideaScores;
  const report = parseReport(pin.content);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="idea-modal__overlay" onClick={onClose}>
      <div className="idea-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="idea-modal__header">
          <div className="idea-modal__header-left">
            <span className="idea-modal__flask">🧪</span>
            <span className="idea-modal__header-label">IDEA INCUBATOR</span>
          </div>
          <button className="idea-modal__close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="idea-modal__content">
          {/* Left column — Overview */}
          <div className="idea-modal__col-left">
            <h2 className="idea-modal__title">{pin.title}</h2>

            {report?.oneLiner && (
              <p className="idea-modal__oneliner">{report.oneLiner}</p>
            )}

            {/* Verdict */}
            {verdict && (
              <div className={`idea-modal__verdict ${verdict.className}`}>
                <span className="idea-modal__verdict-emoji">{verdict.emoji}</span>
                <span className="idea-modal__verdict-label">{verdict.label}</span>
              </div>
            )}

            {/* Score bars */}
            {scores && (
              <div className="idea-modal__scores">
                {scores.viability != null && <ScoreBar label="Viability" value={scores.viability} />}
                {scores.alignment != null && <ScoreBar label="Alignment" value={scores.alignment} />}
                {scores.effort != null && <ScoreBar label="Effort" value={scores.effort} />}
                {scores.competition != null && <ScoreBar label="Market Gap" value={scores.competition} />}
                {scores.marketSignal != null && <ScoreBar label="Demand" value={scores.marketSignal} />}
              </div>
            )}

            {/* Meta */}
            <div className="idea-modal__meta">
              {pin.ideaCompetitors != null && (
                <span className="idea-modal__meta-item">
                  {pin.ideaCompetitors} competitor{pin.ideaCompetitors !== 1 ? 's' : ''} found
                </span>
              )}
              {pin.ideaEffortEstimate && (
                <span className="idea-modal__meta-item">
                  MVP: {pin.ideaEffortEstimate}
                </span>
              )}
            </div>

            {/* Summary */}
            {pin.ideaResearchSummary && (
              <div className="idea-modal__summary-block">
                <h3 className="idea-modal__section-title">Summary</h3>
                <p className="idea-modal__summary">{pin.ideaResearchSummary}</p>
              </div>
            )}

            {/* Recommendation */}
            {report?.recommendation && (
              <div className="idea-modal__recommendation">
                <h3 className="idea-modal__section-title">Recommendation</h3>
                <p className="idea-modal__rec-text">→ {report.recommendation}</p>
              </div>
            )}

            {/* Revenue Model */}
            {report?.revenueModel && (
              <div className="idea-modal__revenue">
                <h3 className="idea-modal__section-title">Revenue Model</h3>
                <p className="idea-modal__source-text">{report.revenueModel}</p>
              </div>
            )}
          </div>

          {/* Right column — Sources & Evidence */}
          <div className="idea-modal__col-right">
            {/* Competitors */}
            {report?.competitors && report.competitors.length > 0 && (
              <div className="idea-modal__source-group">
                <h3 className="idea-modal__section-title">Competitors</h3>
                {report.competitors.map((c, i) => (
                  <div key={i} className="idea-modal__competitor">
                    {(() => {
                      const competitorUrl = getSafeHttpUrl(c.url);
                      return (
                        <>
                          <div className="idea-modal__competitor-name">
                            {competitorUrl ? (
                              <a href={competitorUrl} target="_blank" rel="noopener noreferrer">{c.name} ↗</a>
                            ) : c.name}
                          </div>
                          <div className="idea-modal__competitor-desc">{c.description}</div>
                          {c.gap && (
                            <div className="idea-modal__competitor-gap">
                              <span className="idea-modal__gap-label">Gap:</span> {c.gap}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}

            {/* Market Evidence */}
            {report?.marketEvidence && report.marketEvidence.length > 0 && (
              <div className="idea-modal__source-group">
                <h3 className="idea-modal__section-title">Market Evidence</h3>
                <ul className="idea-modal__evidence-list">
                  {report.marketEvidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Notes */}
            {report?.technicalNotes && (
              <div className="idea-modal__source-group">
                <h3 className="idea-modal__section-title">Technical Notes</h3>
                <p className="idea-modal__source-text">{report.technicalNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="idea-modal__footer">
          <span className="idea-modal__date">
            Incubated {new Date(pin.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </footer>
      </div>
    </div>
  );
}
