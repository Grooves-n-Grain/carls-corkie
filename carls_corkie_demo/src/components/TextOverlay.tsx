import { interpolate, useCurrentFrame } from "remotion";
import { ui } from "../fonts";

interface TextOverlayProps {
  text: string;
  startFrame: number;
  holdFrames?: number;
  fadeFrames?: number;
  size?: number;
  color?: string;
  align?: "left" | "center" | "right";
  bottom?: number;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  startFrame,
  holdFrames = 60,
  fadeFrames = 12,
  size = 28,
  color = "#f5f0e6",
  align = "center",
  bottom = 60,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const fadeInEnd = fadeFrames;
  const holdEnd = fadeInEnd + holdFrames;
  const fadeOutEnd = holdEnd + fadeFrames;

  const opacity = interpolate(
    localFrame,
    [0, fadeInEnd, holdEnd, fadeOutEnd],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const y = interpolate(localFrame, [0, fadeInEnd], [16, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  if (localFrame > fadeOutEnd) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: 0,
        right: 0,
        textAlign: align,
        opacity,
        transform: `translateY(${y}px)`,
        pointerEvents: "none",
        padding: "0 60px",
      }}
    >
      <span
        style={{
          fontFamily: ui,
          fontSize: size,
          fontWeight: 600,
          color,
          textShadow:
            "0 2px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)",
          letterSpacing: "0.01em",
          lineHeight: 1.3,
        }}
      >
        {text}
      </span>
    </div>
  );
};
