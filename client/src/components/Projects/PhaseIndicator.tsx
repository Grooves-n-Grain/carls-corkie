import type { ProjectPhase } from '../../types/project';

const PHASES: ProjectPhase[] = ['concept', 'build', 'polish', 'publish', 'shipped'];
const PHASE_LABELS: Record<ProjectPhase, string> = {
  concept: 'Concept',
  build: 'Build',
  polish: 'Polish',
  publish: 'Publish',
  shipped: 'Shipped ✓',
};

interface PhaseIndicatorProps {
  currentPhase: ProjectPhase;
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIdx = PHASES.indexOf(currentPhase);
  return (
    <div className="phase-indicator">
      {PHASES.map((phase, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={phase} className="phase-indicator__segment">
            <div
              className={[
                'phase-indicator__dot',
                isPast ? 'phase-indicator__dot--past' : '',
                isCurrent ? 'phase-indicator__dot--current' : '',
              ].join(' ')}
            />
            {i < PHASES.length - 1 && (
              <div className={`phase-indicator__line ${isPast ? 'phase-indicator__line--past' : ''}`} />
            )}
          </div>
        );
      })}
      <span className="phase-indicator__label">{PHASE_LABELS[currentPhase]}</span>
    </div>
  );
}
