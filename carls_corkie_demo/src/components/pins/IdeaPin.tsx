import { ui } from "../../fonts";

interface IdeaScore {
  label: string;
  score: number; // 0-10
}

interface IdeaPinProps {
  title: string;
  verdict: "hot" | "warm" | "cold";
  summary: string;
  scores?: IdeaScore[];
}

const verdictConfig = {
  hot: { emoji: "🔥", label: "High Potential", color: "#dc2626", bg: "#fee2e2" },
  warm: { emoji: "💡", label: "Worth Exploring", color: "#d97706", bg: "#fef3c7" },
  cold: { emoji: "🧊", label: "Cool But Later", color: "#1d6fa4", bg: "#dbeafe" },
};

const scoreColor = (s: number) =>
  s >= 7 ? "#15803d" : s >= 4 ? "#d97706" : "#dc2626";

export const IdeaPin: React.FC<IdeaPinProps> = ({ title, verdict, summary, scores }) => {
  const cfg = verdictConfig[verdict];

  return (
    <div
      style={{
        width: 250,
        background: "#dcfce7",
        borderRadius: 4,
        padding: "22px 14px 16px",
        border: "1px solid #d4c9b8",
        fontFamily: ui,
      }}
    >
      {/* Flask header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>🧪</span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#5c4d3d",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Idea Incubator
        </span>
      </div>

      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#2d2418",
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      {/* Verdict badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: cfg.bg,
          border: `1px solid ${cfg.color}`,
          color: cfg.color,
          borderRadius: 12,
          padding: "2px 8px",
          fontSize: 10,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {cfg.emoji} {cfg.label}
      </div>

      <p style={{ fontSize: 11, color: "#5c4d3d", lineHeight: 1.4, marginBottom: scores ? 10 : 0 }}>
        {summary}
      </p>

      {scores && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {scores.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, color: "#8b7355", width: 72, flexShrink: 0 }}>
                {s.label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 5,
                  background: "#d4c9b8",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${s.score * 10}%`,
                    height: "100%",
                    background: scoreColor(s.score),
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
