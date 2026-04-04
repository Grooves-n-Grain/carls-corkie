import { interpolate, useCurrentFrame } from "remotion";
import { ui } from "../../fonts";

interface AlertPinProps {
  title: string;
  content?: string;
  pulse?: boolean;
}

export const AlertPin: React.FC<AlertPinProps> = ({ title, content, pulse = false }) => {
  const frame = useCurrentFrame();

  const pulseScale = pulse
    ? interpolate(
        (frame % 45) / 45,
        [0, 0.3, 0.6, 1],
        [1, 1.35, 1.35, 1],
        { extrapolateRight: "clamp" }
      )
    : 1;

  const pulseOpacity = pulse
    ? interpolate(
        (frame % 45) / 45,
        [0, 0.3, 0.6, 1],
        [0.7, 0, 0, 0.7],
        { extrapolateRight: "clamp" }
      )
    : 0;

  return (
    <div
      style={{
        width: 220,
        background: "#fff1f1",
        borderRadius: 4,
        padding: "22px 16px 16px",
        border: "1px solid #fca5a5",
        fontFamily: ui,
        position: "relative",
      }}
    >
      {/* Pulse ring */}
      {pulse && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${pulseScale})`,
            width: "100%",
            height: "100%",
            borderRadius: 4,
            border: "2px solid #ef4444",
            opacity: pulseOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Warning icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#fee2e2",
            border: "2px solid #ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          ⚠️
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#dc2626",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Alert
        </span>
      </div>

      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#7f1d1d",
          lineHeight: 1.3,
          marginBottom: content ? 6 : 0,
        }}
      >
        {title}
      </h3>

      {content && (
        <p style={{ fontSize: 11, color: "#991b1b", lineHeight: 1.4 }}>{content}</p>
      )}
    </div>
  );
};
