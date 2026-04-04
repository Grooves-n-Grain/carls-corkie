import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";
import { CorkBackground } from "../components/CorkBackground";
import { handwritten, ui } from "../fonts";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Board fade in
  const boardOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Logo springs down from above
  const logoScale = spring({ frame: Math.max(0, frame - 10), fps, from: 0, to: 1, config: { damping: 18, stiffness: 180 } });
  const logoY = interpolate(logoScale, [0, 1], [-60, 0]);

  // Subtitle fades in
  const subtitleOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const subtitleY = interpolate(frame, [50, 70], [10, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: boardOpacity }}>
      <CorkBackground>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Logo */}
          <div
            style={{
              transform: `translateY(${logoY}px) scale(${logoScale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Img
              src={staticFile("carls-corkie.png")}
              style={{ width: 160, height: "auto", filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))" }}
            />
            <div
              style={{
                fontFamily: handwritten,
                fontSize: 64,
                color: "#f5f0e6",
                textShadow: "0 3px 12px rgba(0,0,0,0.7)",
                letterSpacing: "0.02em",
              }}
            >
              carl's corkie
            </div>
          </div>

          {/* Subtitle */}
          <div
            style={{
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleY}px)`,
              fontFamily: ui,
              fontSize: 22,
              color: "#a89b8c",
              letterSpacing: "0.05em",
              textAlign: "center",
            }}
          >
            your AI-powered corkboard
          </div>
        </div>
      </CorkBackground>
    </div>
  );
};
