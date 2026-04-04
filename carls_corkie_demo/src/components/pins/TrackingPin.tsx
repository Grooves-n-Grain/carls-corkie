import { ui } from "../../fonts";

interface TrackingPinProps {
  title: string;
  carrier: string;
  trackingNumber: string;
  status: "in-transit" | "out-for-delivery" | "delivered" | "pre-transit";
  eta?: string;
  arrivingToday?: boolean;
}

const statusConfig = {
  "pre-transit": { emoji: "📦", label: "Pre-transit", color: "#8b949e" },
  "in-transit": { emoji: "🚚", label: "In Transit", color: "#1d6fa4" },
  "out-for-delivery": { emoji: "🏃", label: "Out for Delivery", color: "#d97706" },
  delivered: { emoji: "✅", label: "Delivered", color: "#15803d" },
};

export const TrackingPin: React.FC<TrackingPinProps> = ({
  title,
  carrier,
  trackingNumber,
  status,
  eta,
  arrivingToday = false,
}) => {
  const cfg = statusConfig[status];

  return (
    <div
      style={{
        width: 240,
        background: "#dcfce7",
        borderRadius: 4,
        padding: "22px 16px 16px",
        border: "1px solid #d4c9b8",
        fontFamily: ui,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 22 }}>📦</span>
        <div>
          <div style={{ fontSize: 11, color: "#5c4d3d", fontWeight: 600 }}>{carrier}</div>
          <div style={{ fontSize: 10, color: "#8b7355", fontFamily: "monospace" }}>
            {trackingNumber}
          </div>
        </div>
        {arrivingToday && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 9,
              background: "#dcfce7",
              border: "1px solid #4a7c59",
              color: "#166534",
              borderRadius: 10,
              padding: "2px 6px",
              fontWeight: 700,
            }}
          >
            🎉 Today!
          </span>
        )}
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

      {/* Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: cfg.color,
          fontWeight: 600,
          marginBottom: eta ? 4 : 0,
        }}
      >
        <span>{cfg.emoji}</span>
        <span>{cfg.label}</span>
      </div>

      {eta && (
        <div style={{ fontSize: 11, color: "#5c4d3d" }}>ETA: {eta}</div>
      )}
    </div>
  );
};
