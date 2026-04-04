import { ui } from "../../fonts";

interface EventPinProps {
  title: string;
  date: string;
  time: string;
  soon?: boolean;
}

export const EventPin: React.FC<EventPinProps> = ({ title, date, time, soon = false }) => {
  return (
    <div
      style={{
        width: 220,
        background: "#dcfce7",
        borderRadius: 4,
        padding: "22px 16px 16px",
        border: "1px solid #d4c9b8",
        fontFamily: ui,
      }}
    >
      {/* Calendar icon header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: "#4a7c59",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#fff",
          }}
        >
          📅
        </div>
        {soon && (
          <span
            style={{
              fontSize: 10,
              background: "#fef3c7",
              border: "1px solid #f59e0b",
              color: "#92400e",
              borderRadius: 10,
              padding: "2px 7px",
              fontWeight: 600,
            }}
          >
            ⏰ Soon
          </span>
        )}
      </div>

      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#2d2418",
          marginBottom: 6,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      <div style={{ fontSize: 11, color: "#5c4d3d" }}>{date}</div>
      <div style={{ fontSize: 11, color: "#5c4d3d" }}>{time}</div>
    </div>
  );
};
