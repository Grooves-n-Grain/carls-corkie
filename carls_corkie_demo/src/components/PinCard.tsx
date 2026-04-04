import { spring, useCurrentFrame, useVideoConfig } from "remotion";

interface PinCardProps {
  rotation: number;
  children: React.ReactNode;
  lifted?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}

export function getRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 60) - 30) / 10; // -3 to +3 degrees
}

export const PinCard: React.FC<PinCardProps> = ({
  rotation,
  children,
  lifted = false,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - delay);

  const scale = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, stiffness: 180 },
  });

  const shadow = lifted
    ? "0 20px 40px rgba(0,0,0,0.55), 0 8px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)"
    : "0 8px 20px rgba(0,0,0,0.45), 0 3px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)";

  const translateY = lifted ? -6 : 0;

  return (
    <div
      style={{
        transform: `scale(${scale}) rotate(${rotation}deg) translateY(${translateY}px)`,
        transformOrigin: "center top",
        boxShadow: shadow,
        borderRadius: 4,
        position: "relative",
        transition: "none",
        ...style,
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
          boxShadow: "0 2px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2)",
          zIndex: 10,
        }}
      />
      {children}
    </div>
  );
};
