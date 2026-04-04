import { interpolate, useCurrentFrame } from "remotion";
import { ui } from "../../fonts";

interface TaskPinProps {
  title: string;
  content?: string;
  priority?: 1 | 2 | 3;
  checkItemAtFrame?: number; // frame at which to animate item 0 as checked
}

const priorityColor = { 1: "#b54a32", 2: "#c97b4b", 3: "#4a7c59" };

function parseChecklist(content: string) {
  return content.split("\n").map((line) => {
    const m = line.match(/^\[([ xX])\]\s*(.*)/);
    if (m) return { checked: m[1].toLowerCase() === "x", text: m[2] };
    return null;
  }).filter(Boolean) as { checked: boolean; text: string }[];
}

export const TaskPin: React.FC<TaskPinProps> = ({ title, content, priority, checkItemAtFrame }) => {
  const frame = useCurrentFrame();
  const items = content ? parseChecklist(content) : [];

  return (
    <div
      style={{
        width: 240,
        background: "#dcfce7",
        borderRadius: 4,
        padding: "22px 16px 16px",
        position: "relative",
        fontFamily: ui,
        border: "1px solid #d4c9b8",
        backgroundImage:
          "repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.05) 23px, rgba(0,0,0,0.05) 24px)",
      }}
    >
      {/* Priority dot */}
      {priority && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: priorityColor[priority],
          }}
        />
      )}

      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#2d2418",
          marginBottom: 10,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      {items.map((item, i) => {
        const isAnimatedItem = i === 0 && checkItemAtFrame !== undefined;
        const progress = isAnimatedItem
          ? interpolate(frame, [checkItemAtFrame!, checkItemAtFrame! + 20], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            })
          : 0;
        const isChecked = item.checked || (isAnimatedItem && progress > 0.5);

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
              opacity: isChecked ? 0.55 : 1,
            }}
          >
            {/* Checkbox */}
            <div
              style={{
                width: 14,
                height: 14,
                border: `2px solid ${isChecked ? "#4a7c59" : "#8b7355"}`,
                borderRadius: 3,
                background: isChecked ? "#4a7c59" : "#ffffff",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isChecked && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {/* Text with animated strikethrough */}
            <div style={{ position: "relative", fontSize: 12, color: "#2d2418", lineHeight: 1.4 }}>
              {item.text}
              {isAnimatedItem && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    height: 1.5,
                    background: "#5c4d3d",
                    width: `${progress * 100}%`,
                    transition: "none",
                  }}
                />
              )}
              {!isAnimatedItem && isChecked && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: 1.5,
                    background: "#5c4d3d",
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
