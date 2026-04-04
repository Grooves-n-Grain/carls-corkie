import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CorkBackground } from "../components/CorkBackground";
import { TaskPin } from "../components/pins/TaskPin";
import { ui } from "../fonts";

export const FocusModeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Focus ring pulses in
  const ringScale = spring({ frame: Math.max(0, frame - 20), fps, from: 0.8, to: 1, config: { damping: 20, stiffness: 150 } });
  const ringOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Pin scales up to center
  const pinScale = spring({ frame, fps, from: 0.6, to: 1, config: { damping: 16, stiffness: 160 } });

  // Label fades in
  const labelOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Sub-caption
  const subOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CorkBackground>
        {/* Focus Mode label top */}
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: labelOpacity,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(245,240,230,0.08)",
              border: "1px solid rgba(245,240,230,0.2)",
              borderRadius: 20,
              padding: "6px 18px",
              fontFamily: ui,
              fontSize: 13,
              fontWeight: 600,
              color: "#a89b8c",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            🎯 Focus Mode
          </div>
        </div>

        {/* Centered pin with focus ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Focus ring */}
          <div
            style={{
              position: "absolute",
              width: 310,
              height: 230,
              borderRadius: 12,
              border: "2px solid rgba(74,124,89,0.6)",
              boxShadow: "0 0 40px rgba(74,124,89,0.2), 0 0 0 6px rgba(74,124,89,0.06)",
              transform: `scale(${ringScale})`,
              opacity: ringOpacity,
            }}
          />

          {/* The single pin */}
          <div
            style={{
              transform: `scale(${pinScale})`,
              position: "relative",
            }}
          >
            {/* Pushpin */}
            <div
              style={{
                position: "absolute",
                top: -10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #d4955a, #b87333 50%, #8b5a2b)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                zIndex: 10,
              }}
            />
            <div
              style={{
                boxShadow: "0 12px 32px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.35)",
              }}
            >
              <TaskPin
                title="Review launch checklist"
                content="[ ] Update README\n[x] Push to GitHub\n[ ] Post on Twitter"
                priority={1}
              />
            </div>
          </div>
        </div>

        {/* Caption */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: ui,
              fontSize: 26,
              fontWeight: 600,
              color: "#f5f0e6",
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
              marginBottom: 10,
            }}
          >
            Focus Mode — one thing at a time
          </div>
          <div
            style={{
              fontFamily: ui,
              fontSize: 16,
              color: "#a89b8c",
              opacity: subOpacity,
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}
          >
            Built for ADHD brains
          </div>
        </div>
      </CorkBackground>
    </div>
  );
};
