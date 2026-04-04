import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";
import { CorkBackground } from "../components/CorkBackground";
import { handwritten, ui } from "../fonts";

const pills = ["Open source", "AI-powered", "ADHD-friendly"];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo springs up
  const logoSpring = spring({ frame: Math.max(0, frame - 5), fps, from: 0, to: 1, config: { damping: 16, stiffness: 160 } });
  const logoY = interpolate(logoSpring, [0, 1], [30, 0]);

  // Pills stagger in
  const pillOpacity = (i: number) => {
    const start = 30 + i * 18;
    return interpolate(frame, [start, start + 18], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  };

  const pillY = (i: number) => {
    const start = 30 + i * 18;
    return interpolate(frame, [start, start + 18], [12, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  };

  // GitHub line fades in
  const githubOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CorkBackground>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
          }}
        >
          {/* Logo + title */}
          <div
            style={{
              opacity: logoSpring,
              transform: `translateY(${logoY}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Img
              src={staticFile("carls-corkie.png")}
              style={{ width: 120, height: "auto", filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))" }}
            />
            <div
              style={{
                fontFamily: handwritten,
                fontSize: 56,
                color: "#f5f0e6",
                textShadow: "0 3px 12px rgba(0,0,0,0.7)",
              }}
            >
              carl's corkie
            </div>
          </div>

          {/* Pills */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            {pills.map((pill, i) => (
              <div
                key={pill}
                style={{
                  opacity: pillOpacity(i),
                  transform: `translateY(${pillY(i)}px)`,
                  background: "rgba(245,240,230,0.1)",
                  border: "1px solid rgba(245,240,230,0.25)",
                  borderRadius: 24,
                  padding: "8px 20px",
                  fontFamily: ui,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#d5cec6",
                  letterSpacing: "0.04em",
                }}
              >
                {pill}
              </div>
            ))}
          </div>

          {/* GitHub */}
          <div
            style={{
              opacity: githubOpacity,
              fontFamily: ui,
              fontSize: 16,
              color: "#6b7280",
              letterSpacing: "0.03em",
            }}
          >
            github.com/carls-corkie
          </div>
        </div>
      </CorkBackground>
    </div>
  );
};
