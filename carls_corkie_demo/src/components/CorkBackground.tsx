export const CorkBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#1a1512",
        overflow: "hidden",
      }}
    >
      {/* Grain texture layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(255,255,255,0.012) 3px,
              rgba(255,255,255,0.012) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 5px,
              rgba(255,255,255,0.008) 5px,
              rgba(255,255,255,0.008) 6px
            )
          `,
        }}
      />
      {/* Warm vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(10,7,5,0.6) 100%)",
        }}
      />
      {children}
    </div>
  );
};
