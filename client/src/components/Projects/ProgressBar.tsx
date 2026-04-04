interface ProgressBarProps {
  done: number;
  total: number;
  color: string;
}

export function ProgressBar({ done, total, color }: ProgressBarProps) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div className="progress-bar">
      <div className="progress-bar__track">
        <div
          className="progress-bar__fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="progress-bar__label">{done}/{total}</span>
    </div>
  );
}
