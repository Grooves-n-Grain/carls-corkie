import { ui } from "../../fonts";

interface GitHubPinProps {
  repo: string;
  stars: number;
  forks: number;
  description: string;
}

export const GitHubPin: React.FC<GitHubPinProps> = ({ repo, stars, forks, description }) => {
  return (
    <div
      style={{
        width: 260,
        background: "#0d1117",
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid #30363d",
        fontFamily: ui,
      }}
    >
      {/* Terminal title bar */}
      <div
        style={{
          background: "#161b22",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderBottom: "1px solid #30363d",
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ fontSize: 11, color: "#8b949e", marginLeft: 6, fontFamily: "monospace" }}>
          {repo}
        </span>
      </div>

      {/* Terminal body */}
      <div style={{ padding: "14px 14px 12px" }}>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#7ee787", marginBottom: 10 }}>
          $ cat README.md
        </div>

        {/* Description blockquote */}
        <div
          style={{
            borderLeft: "3px solid #238636",
            paddingLeft: 10,
            marginBottom: 12,
            fontSize: 12,
            color: "#c9d1d9",
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 14 }}>
          <span style={{ fontSize: 11, color: "#8b949e" }}>
            <span style={{ color: "#e3b341" }}>★</span> {stars}
          </span>
          <span style={{ fontSize: 11, color: "#8b949e" }}>
            <span style={{ color: "#58a6ff" }}>⑂</span> {forks}
          </span>
        </div>
      </div>
    </div>
  );
};
