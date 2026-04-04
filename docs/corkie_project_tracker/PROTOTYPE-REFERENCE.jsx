import { useState, useEffect, useCallback, useRef } from "react";

// ─── Sample Data ───────────────────────────────────────────
const SAMPLE_PROJECTS = [
  {
    id: "proj-1", name: "FPV Proximity Alert", emoji: "📡", color: "#e8a838", phase: "build",
    projectStatus: "active", holdReason: "", createdAt: "2026-03-28",
    tracks: [
      { id: "t1", name: "Firmware", owner: "claude", status: "done",
        tasks: [
          { id: "t1-1", text: "ESP32 IMU sensor fusion (complementary filter)", done: true },
          { id: "t1-2", text: "Servo trigger at 35° threshold", done: true },
          { id: "t1-3", text: "Hysteresis release at 28°", done: true },
          { id: "t1-4", text: "100hz loop, 98% gyro / 2% accel", done: true },
        ],
        attachment: { type: "code", label: "firmware.ino", note: "v1.0 — ready for bench test" },
      },
      { id: "t2", name: "3D Case", owner: "you", status: "active",
        tasks: [
          { id: "t2-1", text: "Design mount bracket for seatstay", done: false },
          { id: "t2-2", text: "Print temp TPU shell", done: false },
          { id: "t2-3", text: "Test fit on Devinci frame", done: false },
        ], attachment: null,
      },
      { id: "t3", name: "Script & Content", owner: "shared", status: "waiting",
        tasks: [
          { id: "t3-1", text: "Write demo script / talking points", done: false },
          { id: "t3-2", text: "Film bench test with serial monitor", done: false },
          { id: "t3-3", text: "Film mounted ride test", done: false },
        ], attachment: null,
      },
      { id: "t4", name: "Publish", owner: "shared", status: "locked",
        tasks: [
          { id: "t4-1", text: "Edit video (DaVinci / CapCut)", done: false },
          { id: "t4-2", text: "Write Reddit post for r/fpv", done: false },
          { id: "t4-3", text: "Post to groovesngrain.com", done: false },
        ], attachment: null,
      },
    ],
  },
  {
    id: "proj-2", name: "Camera Preset System", emoji: "🎬", color: "#4ecdc4", phase: "build",
    projectStatus: "active", holdReason: "", createdAt: "2026-03-31",
    tracks: [
      { id: "t5", name: "Backend Code", owner: "claude", status: "active",
        tasks: [
          { id: "t5-1", text: "Camera profile YAML schema", done: true },
          { id: "t5-2", text: "OBS WebSocket integration", done: false },
          { id: "t5-3", text: "Preset switcher CLI", done: false },
        ], attachment: null,
      },
      { id: "t6", name: "Hardware Setup", owner: "you", status: "active",
        tasks: [
          { id: "t6-1", text: "Mount cameras at desk stations", done: false },
          { id: "t6-2", text: "Cable management / labeling", done: false },
          { id: "t6-3", text: "Test each camera preset", done: false },
        ], attachment: null,
      },
      { id: "t7", name: "Publish", owner: "shared", status: "locked",
        tasks: [
          { id: "t7-1", text: "Record demo walkthrough", done: false },
          { id: "t7-2", text: "Post to GitHub + Reddit", done: false },
        ], attachment: null,
      },
    ],
  },
  {
    id: "proj-3", name: "GnG Lamp Photography", emoji: "💡", color: "#f7786b", phase: "polish",
    projectStatus: "active", holdReason: "", createdAt: "2026-03-25",
    tracks: [
      { id: "t8", name: "Product Shots", owner: "you", status: "active",
        tasks: [
          { id: "t8-1", text: "Shoot walnut lamp with halo light", done: true },
          { id: "t8-2", text: "ProRAW capture + edit in Lightroom", done: true },
          { id: "t8-3", text: "Reshoot katakana panel (Matrix lamp)", done: false },
        ],
        attachment: { type: "image", label: "walnut-lamp-hero.jpg", note: "iPhone 14 Pro, ProRAW" },
      },
      { id: "t9", name: "Listing Copy", owner: "claude", status: "waiting",
        tasks: [
          { id: "t9-1", text: "Write Etsy listing descriptions", done: false },
          { id: "t9-2", text: "SEO keyword research for handmade lamps", done: false },
        ], attachment: null,
      },
      { id: "t10", name: "Publish", owner: "shared", status: "locked",
        tasks: [
          { id: "t10-1", text: "Create Etsy store @GroovesNGrain", done: false },
          { id: "t10-2", text: "Post first 3 listings", done: false },
          { id: "t10-3", text: "Share on Instagram", done: false },
        ], attachment: null,
      },
    ],
  },
  {
    id: "proj-4", name: "E-Bike Battery Monitor", emoji: "🔋", color: "#a8e6cf", phase: "concept",
    projectStatus: "on-hold", holdReason: "Waiting for BMS breakout board from AliExpress (~2 weeks)", createdAt: "2026-03-20",
    tracks: [
      { id: "t11", name: "ESP32 Voltage Reader", owner: "claude", status: "waiting",
        tasks: [
          { id: "t11-1", text: "Read individual cell voltages via BMS UART", done: false },
          { id: "t11-2", text: "MQTT publish to Home Assistant", done: false },
        ], attachment: null,
      },
      { id: "t12", name: "Mount & Wiring", owner: "you", status: "waiting",
        tasks: [
          { id: "t12-1", text: "Wire BMS breakout to ESP32", done: false },
          { id: "t12-2", text: "3D print enclosure for downtube", done: false },
        ], attachment: null,
      },
    ],
  },
];

const PHASES = ["concept", "build", "polish", "publish", "shipped"];
const PHASE_LABELS = { concept: "Concept", build: "Build", polish: "Polish", publish: "Publish", shipped: "Shipped ✓" };
const OWNER_ICONS = { claude: "🤖", you: "🧑‍🔧", shared: "🤝" };
const STATUS_COLORS = { done: "#4ecdc4", active: "#e8a838", waiting: "#8899aa", locked: "#556677" };
const PIN_TYPE_ICONS = { task: "☑️", note: "📝", alert: "🚨", github: "💻", link: "🔗", event: "📅", email: "✉️" };

const SAMPLE_PINS = [
  { id: "pin-1", type: "alert", title: "Washer cycle complete", body: "Basement washer finished 3 min ago", priority: 2, status: "active" },
  { id: "pin-2", type: "task", title: "Calibrate IMU on bench", body: "Serial monitor @ 115200 baud, check gyro drift", priority: 1, status: "active" },
  { id: "pin-3", type: "github", title: "fpv-ai-scrubber", body: "★ 42  ↓ 8", url: "https://github.com/zheroz00/fpv-ai-scrubber", status: "active" },
  { id: "pin-4", type: "note", title: "Battery voltage check", body: "72V pack reads 67.2V — healthy. Next check Friday.", priority: 3, status: "active" },
  { id: "pin-5", type: "task", title: "Post walnut lamp to Reddit", body: "r/woodworking and r/led — hero shots ready", priority: 2, status: "active" },
];

// ─── Persistence ─────────────────────────────────────────
function usePersistedState(key, fallback) {
  const [state, setState] = useState(fallback);
  const loaded = useRef(false);
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(key);
        if (result?.value) setState(JSON.parse(result.value));
      } catch (e) {}
      loaded.current = true;
    })();
  }, [key]);
  const setPersisted = useCallback((val) => {
    setState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      if (loaded.current) window.storage.set(key, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [key]);
  return [state, setPersisted];
}

// ─── Shared UI ───────────────────────────────────────────
function ProgressBar({ tasks, color }) {
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "rgba(0,0,0,0.3)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color || "#4ecdc4", borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: "#a0906c", fontFamily: "var(--font-mono)", minWidth: 36 }}>{done}/{total}</span>
    </div>
  );
}

// ─── Context Menu ────────────────────────────────────────
function ProjectMenu({ project, onAction, onClose }) {
  const menuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [];
  if (project.projectStatus === "active") {
    items.push({ label: "⏸️  Put On Hold", action: "hold" });
    items.push({ label: "📦  Archive", action: "archive" });
  } else if (project.projectStatus === "on-hold") {
    items.push({ label: "▶️  Resume", action: "resume" });
    items.push({ label: "📦  Archive", action: "archive" });
  } else if (project.projectStatus === "archived") {
    items.push({ label: "▶️  Reactivate", action: "resume" });
  }
  items.push({ label: "🗑️  Delete", action: "delete", danger: true });

  return (
    <div ref={menuRef} style={{
      position: "absolute", top: 36, right: 8, zIndex: 100,
      background: "linear-gradient(145deg, #2e2818 0%, #1e1a0f 100%)",
      border: "1px solid rgba(232,168,56,0.2)", borderRadius: 10,
      padding: "6px 0", minWidth: 170,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    }}>
      {items.map((item, i) => (
        <div key={i}>
          {item.danger && <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />}
          <button onClick={() => { onAction(item.action); onClose(); }} style={{
            display: "block", width: "100%", padding: "8px 14px", background: "transparent", border: "none",
            color: item.danger ? "#ff6b6b" : "#d4c8a8", fontFamily: "var(--font-mono)", fontSize: 12,
            textAlign: "left", cursor: "pointer", transition: "background 0.15s",
          }}
            onMouseEnter={(e) => e.target.style.background = "rgba(232,168,56,0.08)"}
            onMouseLeave={(e) => e.target.style.background = "transparent"}>
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Hold Reason Modal ───────────────────────────────────
function HoldModal({ project, onConfirm, onClose }) {
  const [reason, setReason] = useState(project.holdReason || "");
  const suggestions = [
    "Waiting for parts to arrive",
    "Waiting on 3D print to finish",
    "Need to order components",
    "Blocked by another project",
    "Taking a break from this one",
  ];
  return (
    <div onClick={onClose} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "linear-gradient(145deg, #2a2215 0%, #1e1a0f 100%)",
        border: "1px solid rgba(232,168,56,0.2)", borderRadius: 16, padding: 24, width: 380,
      }}>
        <h3 style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", color: "#e8dcc8", fontSize: 18 }}>
          ⏸️ Put On Hold
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#8a7e68", fontFamily: "var(--font-mono)" }}>
          {project.emoji} {project.name}
        </p>
        <label style={lblStyle}>Why? (helps future-you remember)</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Waiting for BMS board from AliExpress"
          style={inputStyle} autoFocus />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8, marginBottom: 16 }}>
          {suggestions.map((s) => (
            <button key={s} onClick={() => setReason(s)} style={{
              padding: "4px 10px", background: reason === s ? "rgba(232,168,56,0.15)" : "rgba(0,0,0,0.2)",
              border: `1px solid ${reason === s ? "rgba(232,168,56,0.3)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 4, color: reason === s ? "#e8a838" : "#6a5f48",
              fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer", transition: "all 0.15s",
            }}>{s}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...mainBtnStyle, background: "transparent", border: "1px solid #4a4030", color: "#a0906c" }}>Cancel</button>
          <button onClick={() => onConfirm(reason)} style={mainBtnStyle}>Put On Hold</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────
function DeleteModal({ project, onConfirm, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "linear-gradient(145deg, #2a2215 0%, #1e1a0f 100%)",
        border: "1px solid rgba(255,107,107,0.2)", borderRadius: 16, padding: 24, width: 360,
      }}>
        <h3 style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", color: "#ff6b6b", fontSize: 18 }}>
          🗑️ Delete Project
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#8a7e68", fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
          Are you sure you want to delete <strong style={{ color: "#e8dcc8" }}>{project.emoji} {project.name}</strong>? This can't be undone.
          Consider archiving instead if you might want it later.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...mainBtnStyle, background: "transparent", border: "1px solid #4a4030", color: "#a0906c" }}>Cancel</button>
          <button onClick={onConfirm} style={{
            ...mainBtnStyle, background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)", color: "#ff6b6b",
          }}>Delete Forever</button>
        </div>
      </div>
    </div>
  );
}

// ─── Shelf Drawer (On Hold / Archived) ───────────────────
function ShelfDrawer({ projects, label, icon, color, onAction, isOpen, onToggle }) {
  if (projects.length === 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <button onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", width: "100%",
        background: "rgba(0,0,0,0.15)", border: `1px solid ${color}22`, borderRadius: 8,
        cursor: "pointer", transition: "all 0.2s",
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color, letterSpacing: "0.03em" }}>
          {label}
        </span>
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 10, background: `${color}18`, color,
          fontFamily: "var(--font-mono)", fontWeight: 700,
        }}>{projects.length}</span>
        <span style={{
          marginLeft: "auto", fontSize: 12, color: "#6a5f48",
          transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s",
        }}>▶</span>
      </button>
      {isOpen && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "12px 0 0", alignItems: "flex-start" }}>
          {projects.map((project) => {
            const allTasks = project.tracks.flatMap((t) => t.tasks);
            const doneTasks = allTasks.filter((t) => t.done).length;
            const pct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;
            return (
              <div key={project.id} style={{
                background: "linear-gradient(145deg, #222018 0%, #1a180e 100%)",
                border: `1px solid ${project.color}22`, borderLeft: `4px solid ${project.color}44`,
                borderRadius: 10, padding: "12px 14px", minWidth: 250, maxWidth: 320,
                opacity: 0.75, transition: "opacity 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.75"}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{project.emoji}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#c8bca8", fontWeight: 700 }}>{project.name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: `${project.color}88` }}>{pct}%</span>
                </div>
                {project.holdReason && (
                  <div style={{
                    fontSize: 11, color: "#e8a838", fontFamily: "var(--font-mono)", padding: "4px 8px", marginBottom: 8,
                    background: "rgba(232,168,56,0.06)", borderRadius: 4, border: "1px solid rgba(232,168,56,0.1)",
                    lineHeight: 1.4,
                  }}>⏸️ {project.holdReason}</div>
                )}
                <ProgressBar tasks={allTasks} color={`${project.color}88`} />
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button onClick={() => onAction(project.id, "resume")} style={{
                    ...smBtnStyle, flex: 1, fontSize: 11, padding: "5px 8px", textAlign: "center",
                    color: "#4ecdc4", border: "1px solid rgba(78,205,196,0.2)",
                  }}>▶️ Resume</button>
                  {project.projectStatus === "on-hold" && (
                    <button onClick={() => onAction(project.id, "archive")} style={{
                      ...smBtnStyle, fontSize: 11, padding: "5px 8px", color: "#8899aa", border: "1px solid rgba(136,153,170,0.15)",
                    }}>📦</button>
                  )}
                  <button onClick={() => onAction(project.id, "delete")} style={{
                    ...smBtnStyle, fontSize: 11, padding: "5px 8px", color: "#ff6b6b66", border: "1px solid rgba(255,107,107,0.1)",
                  }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Board (mock) ───────────────────────────────────
function PinCard({ pin }) {
  const priorityColors = { 1: "#ff6b6b", 2: "#e8a838", 3: "#4ecdc4" };
  const borderColor = pin.priority ? priorityColors[pin.priority] : "#4a4030";
  return (
    <div style={{
      background: pin.type === "alert" ? "linear-gradient(145deg, #3a2215 0%, #2a1a0f 100%)" : "linear-gradient(145deg, #2e2818 0%, #22200f 100%)",
      border: `1px solid ${borderColor}44`, borderLeft: `4px solid ${borderColor}`,
      borderRadius: 10, padding: "14px 16px", minWidth: 220, maxWidth: 300,
      boxShadow: "0 3px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>{PIN_TYPE_ICONS[pin.type] || "📌"}</span>
        <span style={{
          fontSize: 9, padding: "2px 7px", borderRadius: 3, background: `${borderColor}22`, color: borderColor,
          border: `1px solid ${borderColor}33`, fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
        }}>{pin.type}</span>
      </div>
      <h3 style={{ margin: "0 0 6px", fontSize: 14, fontFamily: "var(--font-display)", color: "#e8dcc8", fontWeight: 700, lineHeight: 1.3 }}>{pin.title}</h3>
      <p style={{ margin: 0, fontSize: 12, color: "#8a7e68", fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>{pin.body}</p>
    </div>
  );
}

function MainBoard({ pins }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, padding: "8px 0", alignItems: "flex-start" }}>
      {pins.map((pin) => <PinCard key={pin.id} pin={pin} />)}
    </div>
  );
}

// ─── Track Card ──────────────────────────────────────────
function TrackCard({ track, onToggleTask, projectColor }) {
  const [expanded, setExpanded] = useState(track.status === "active");
  const isLocked = track.status === "locked";
  return (
    <div style={{
      background: isLocked ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.25)", borderRadius: 8,
      padding: "10px 12px", marginBottom: 8, borderLeft: `3px solid ${STATUS_COLORS[track.status]}`,
      opacity: isLocked ? 0.5 : 1, transition: "all 0.2s ease",
    }}>
      <div onClick={() => !isLocked && setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: isLocked ? "default" : "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{OWNER_ICONS[track.owner]}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "#e8dcc8", letterSpacing: "0.02em" }}>{track.name}</span>
          <span style={{
            fontSize: 9, padding: "2px 6px", borderRadius: 3, background: STATUS_COLORS[track.status],
            color: "#1a1408", fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
          }}>{track.status === "done" ? "✓ Done" : track.status}</span>
        </div>
        {!isLocked && <span style={{ fontSize: 12, color: "#a0906c", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>}
      </div>
      {!isLocked && <div style={{ marginTop: 6 }}><ProgressBar tasks={track.tasks} color={projectColor} /></div>}
      {expanded && !isLocked && (
        <div style={{ marginTop: 8 }}>
          {track.tasks.map((task) => (
            <label key={task.id} style={{
              display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0", cursor: "pointer",
              fontSize: 12, color: task.done ? "#7a6f5a" : "#d4c8a8", fontFamily: "var(--font-mono)",
              textDecoration: task.done ? "line-through" : "none", lineHeight: 1.4,
            }}>
              <input type="checkbox" checked={task.done} onChange={() => onToggleTask(track.id, task.id)} style={{ marginTop: 2, accentColor: projectColor }} />
              <span>{task.text}</span>
            </label>
          ))}
          {track.attachment && (
            <div style={{
              marginTop: 8, padding: "6px 10px", background: "rgba(78,205,196,0.1)",
              border: "1px solid rgba(78,205,196,0.25)", borderRadius: 6, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 13 }}>{track.attachment.type === "code" ? "📄" : "🖼️"}</span>
              <div>
                <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#4ecdc4", fontWeight: 600 }}>{track.attachment.label}</div>
                <div style={{ fontSize: 10, color: "#8a7e68", fontFamily: "var(--font-mono)" }}>{track.attachment.note}</div>
              </div>
            </div>
          )}
        </div>
      )}
      {isLocked && (
        <div style={{ marginTop: 6, fontSize: 10, color: "#5a5040", fontFamily: "var(--font-mono)", fontStyle: "italic" }}>
          🔒 Unlocks when previous tracks complete
        </div>
      )}
    </div>
  );
}

// ─── Phase Indicator ─────────────────────────────────────
function PhaseIndicator({ currentPhase }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "8px 0 12px" }}>
      {PHASES.map((phase, i) => {
        const isCurrent = phase === currentPhase;
        const isPast = PHASES.indexOf(phase) < PHASES.indexOf(currentPhase);
        return (
          <div key={phase} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              width: isCurrent ? 10 : 7, height: isCurrent ? 10 : 7, borderRadius: "50%",
              background: isPast ? "#4ecdc4" : isCurrent ? "#e8a838" : "#3a3020",
              border: isCurrent ? "2px solid #e8a838" : "1px solid #4a4030",
              boxShadow: isCurrent ? "0 0 8px rgba(232,168,56,0.4)" : "none", transition: "all 0.3s ease",
            }} />
            {i < PHASES.length - 1 && <div style={{ width: 20, height: 2, background: isPast ? "#4ecdc4" : "#3a3020", transition: "background 0.3s ease" }} />}
          </div>
        );
      })}
      <span style={{ marginLeft: 8, fontSize: 10, fontFamily: "var(--font-mono)", color: "#a0906c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {PHASE_LABELS[currentPhase]}
      </span>
    </div>
  );
}

// ─── Project Card ────────────────────────────────────────
function ProjectCard({ project, onToggleTask, onExpand, isExpanded, onAction }) {
  const [showMenu, setShowMenu] = useState(false);
  const allTasks = project.tracks.flatMap((t) => t.tasks);
  const doneTasks = allTasks.filter((t) => t.done).length;
  const pct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;
  const activeTracks = project.tracks.filter((t) => t.status === "active");
  const yourActive = activeTracks.filter((t) => t.owner === "you" || t.owner === "shared");
  const claudeActive = activeTracks.filter((t) => t.owner === "claude" || t.owner === "shared");

  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(145deg, #2a2215 0%, #1e1a0f 100%)",
      border: `2px solid ${project.color}33`, borderTop: `4px solid ${project.color}`,
      borderRadius: 12, width: isExpanded ? "100%" : undefined, maxWidth: isExpanded ? 520 : 340, minWidth: 290,
      boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)", transition: "all 0.3s ease", overflow: "hidden",
    }}>
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div onClick={() => onExpand(project.id)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flex: 1 }}>
            <span style={{ fontSize: 20 }}>{project.emoji}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontFamily: "var(--font-display)", color: "#e8dcc8", fontWeight: 700, lineHeight: 1.2 }}>
                {project.name}
              </h3>
              <PhaseIndicator currentPhase={project.phase} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontFamily: "var(--font-mono)", fontWeight: 800, color: project.color, lineHeight: 1 }}>{pct}%</span>
            <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 14, color: "#6a5f48", transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.target.style.background = "rgba(232,168,56,0.1)"; e.target.style.color = "#e8a838"; }}
              onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.color = "#6a5f48"; }}>
              ⋮
            </button>
          </div>
        </div>
        {showMenu && <ProjectMenu project={project} onAction={(action) => onAction(project.id, action)} onClose={() => setShowMenu(false)} />}
        <div onClick={() => onExpand(project.id)} style={{ cursor: "pointer" }}>
          <ProgressBar tasks={allTasks} color={project.color} />
          {!isExpanded && activeTracks.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {activeTracks.map((t) => (
                <span key={t.id} style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 4,
                  background: "rgba(232,168,56,0.12)", border: "1px solid rgba(232,168,56,0.2)",
                  color: "#c8a848", fontFamily: "var(--font-mono)",
                }}>{OWNER_ICONS[t.owner]} {t.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {isExpanded && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{
            display: "flex", gap: 8, marginBottom: 12, padding: "8px 10px",
            background: "rgba(232,168,56,0.06)", borderRadius: 6, border: "1px solid rgba(232,168,56,0.12)",
          }}>
            {yourActive.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: "#a0906c", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Your focus</div>
                {yourActive.map((t) => <div key={t.id} style={{ fontSize: 12, color: "#e8dcc8", fontFamily: "var(--font-mono)" }}>→ {t.name}</div>)}
              </div>
            )}
            {claudeActive.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: "#a0906c", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Claude's working on</div>
                {claudeActive.map((t) => <div key={t.id} style={{ fontSize: 12, color: "#e8dcc8", fontFamily: "var(--font-mono)" }}>→ {t.name}</div>)}
              </div>
            )}
          </div>
          {project.tracks.map((track) => (
            <TrackCard key={track.id} track={track} onToggleTask={onToggleTask} projectColor={project.color} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── New Project Modal ───────────────────────────────────
function NewProjectModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔧");
  const [tracks, setTracks] = useState([
    { name: "Code", owner: "claude" },
    { name: "Hardware / Build", owner: "you" },
    { name: "Publish", owner: "shared" },
  ]);
  const colors = ["#e8a838", "#4ecdc4", "#f7786b", "#a8e6cf", "#c3a6ff", "#ff6b6b"];
  const [color, setColor] = useState(colors[Math.floor(Math.random() * colors.length)]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      id: `proj-${Date.now()}`, name: name.trim(), emoji, color, phase: "concept",
      projectStatus: "active", holdReason: "", createdAt: new Date().toISOString().split("T")[0],
      tracks: tracks.filter((t) => t.name.trim()).map((t, i) => ({
        id: `t-${Date.now()}-${i}`, name: t.name.trim(), owner: t.owner,
        status: i === 0 ? "active" : "waiting", tasks: [], attachment: null,
      })),
    });
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "linear-gradient(145deg, #2a2215 0%, #1e1a0f 100%)",
        border: "1px solid rgba(232,168,56,0.2)", borderRadius: 16, padding: 24, width: 400, maxHeight: "80vh", overflowY: "auto",
      }}>
        <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", color: "#e8dcc8", fontSize: 20 }}>New Project</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={lblStyle}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FPV Proximity Alert" style={inputStyle} autoFocus />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: "0 0 80px" }}>
            <label style={lblStyle}>Emoji</label>
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} style={{ ...inputStyle, textAlign: "center", fontSize: 20 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lblStyle}>Color</label>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {colors.map((c) => (
                <div key={c} onClick={() => setColor(c)} style={{
                  width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer",
                  border: color === c ? "3px solid #e8dcc8" : "2px solid transparent", transition: "border 0.2s",
                }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lblStyle}>Tracks</label>
          {tracks.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
              <input value={t.name} onChange={(e) => { const n = [...tracks]; n[i].name = e.target.value; setTracks(n); }} placeholder="Track name" style={{ ...inputStyle, flex: 1 }} />
              <select value={t.owner} onChange={(e) => { const n = [...tracks]; n[i].owner = e.target.value; setTracks(n); }}
                style={{ ...inputStyle, width: 100, padding: "6px 8px" }}>
                <option value="you">🧑‍🔧 You</option>
                <option value="claude">🤖 Claude</option>
                <option value="shared">🤝 Shared</option>
              </select>
              {tracks.length > 1 && (
                <button onClick={() => setTracks(tracks.filter((_, idx) => idx !== i))} style={{ ...smBtnStyle, fontSize: 15, lineHeight: 1 }}>×</button>
              )}
            </div>
          ))}
          <button onClick={() => setTracks([...tracks, { name: "", owner: "you" }])} style={{ ...smBtnStyle, width: "100%", marginTop: 4, fontSize: 11, padding: "6px" }}>+ Add Track</button>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={onClose} style={{ ...mainBtnStyle, background: "transparent", border: "1px solid #4a4030", color: "#a0906c" }}>Cancel</button>
          <button onClick={handleSubmit} style={mainBtnStyle}>Create Project</button>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────
const lblStyle = { display: "block", fontSize: 10, fontFamily: "var(--font-mono)", color: "#a0906c", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 };
const inputStyle = {
  width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(232,168,56,0.15)", borderRadius: 6, color: "#e8dcc8",
  fontFamily: "var(--font-mono)", fontSize: 13, outline: "none", boxSizing: "border-box",
};
const mainBtnStyle = {
  padding: "8px 16px", background: "rgba(232,168,56,0.2)", border: "1px solid rgba(232,168,56,0.3)",
  borderRadius: 6, color: "#e8a838", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em",
};
const smBtnStyle = {
  padding: "4px 10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(232,168,56,0.15)",
  borderRadius: 4, color: "#a0906c", fontFamily: "var(--font-mono)", fontSize: 13, cursor: "pointer",
};

// ─── Header Button ───────────────────────────────────────
function HeaderBtn({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6,
      background: active ? "rgba(232,168,56,0.18)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${active ? "rgba(232,168,56,0.35)" : "rgba(255,255,255,0.08)"}`,
      color: active ? "#e8a838" : "#8a7e68",
      fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, cursor: "pointer",
      transition: "all 0.2s ease", letterSpacing: "0.03em",
    }}>
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {label}
    </button>
  );
}

// ─── Main App ────────────────────────────────────────────
export default function CorkieDashboard() {
  const [view, setView] = useState("board");
  const [projects, setProjects] = usePersistedState("corkie-projects-v3", SAMPLE_PROJECTS);
  const [expandedId, setExpandedId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("all");
  const [holdTarget, setHoldTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showOnHold, setShowOnHold] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const activeProjects = projects.filter((p) => p.projectStatus === "active");
  const onHoldProjects = projects.filter((p) => p.projectStatus === "on-hold");
  const archivedProjects = projects.filter((p) => p.projectStatus === "archived");

  const toggleTask = (projectId, trackId, taskId) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      return { ...p, tracks: p.tracks.map((t) => {
        if (t.id !== trackId) return t;
        const updated = t.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task);
        const allDone = updated.every((task) => task.done) && updated.length > 0;
        return { ...t, tasks: updated, status: allDone ? "done" : t.status === "done" ? "active" : t.status };
      })};
    }));
  };

  const handleProjectAction = (projectId, action) => {
    if (action === "hold") {
      setHoldTarget(projects.find((p) => p.id === projectId));
    } else if (action === "delete") {
      setDeleteTarget(projects.find((p) => p.id === projectId));
    } else if (action === "archive") {
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, projectStatus: "archived" } : p));
    } else if (action === "resume") {
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, projectStatus: "active", holdReason: "" } : p));
    }
  };

  const confirmHold = (reason) => {
    if (!holdTarget) return;
    setProjects((prev) => prev.map((p) => p.id === holdTarget.id ? { ...p, projectStatus: "on-hold", holdReason: reason } : p));
    setHoldTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const filteredActive = filter === "all" ? activeProjects
    : filter === "yours" ? activeProjects.filter((p) => p.tracks.some((t) => (t.owner === "you" || t.owner === "shared") && t.status === "active"))
    : activeProjects.filter((p) => p.tracks.some((t) => (t.owner === "claude" || t.owner === "shared") && t.status === "active"));

  const totalTasks = activeProjects.flatMap((p) => p.tracks.flatMap((t) => t.tasks));
  const completedTasks = totalTasks.filter((t) => t.done).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 50%, rgba(232,168,56,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(78,205,196,0.03) 0%, transparent 60%), linear-gradient(180deg, #1a1408 0%, #12100a 100%)",
      fontFamily: "var(--font-mono)",
      "--font-mono": "'IBM Plex Mono', monospace",
      "--font-display": "'Playfair Display', Georgia, serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ─── Header ─── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px", borderBottom: "1px solid rgba(232,168,56,0.08)", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 32 }}>🧑‍🔧</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, color: "#e8dcc8", fontWeight: 800, letterSpacing: "-0.01em" }}>carl's corkie</h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <HeaderBtn label="+ New" onClick={() => view === "projects" ? setShowNew(true) : null} />
          <HeaderBtn label="History" icon="📋" />
          <HeaderBtn label="Projects" icon="📌" active={view === "projects"} onClick={() => setView(view === "projects" ? "board" : "projects")} />
          <HeaderBtn label="Focus" icon="🎯" />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ecdc4", boxShadow: "0 0 6px rgba(78,205,196,0.5)" }} />
            <span style={{ fontSize: 11, color: "#6a5f48", fontFamily: "var(--font-mono)" }}>Connected</span>
          </div>
        </div>
      </div>

      {/* ─── View Content ─── */}
      <div style={{ padding: "20px 24px" }}>
        {view === "board" ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: "#6a5f48", fontFamily: "var(--font-mono)" }}>{SAMPLE_PINS.length} active · 0 completed</span>
            </div>
            <MainBoard pins={SAMPLE_PINS} />
            <div style={{
              position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: 12, alignItems: "center",
            }}>
              {["#e8a838", "#4ecdc4", "#c3a6ff", "#f7786b", "#ff6b6b", "#8899aa"].map((c, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                  boxShadow: `0 0 10px ${c}44`, border: "2px solid rgba(0,0,0,0.3)", transition: "transform 0.2s", opacity: 0.85,
                }} onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"}
                   onMouseLeave={(e) => e.target.style.transform = "scale(1)"} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 12, color: "#6a5f48", fontFamily: "var(--font-mono)" }}>
                {activeProjects.length} active · {onHoldProjects.length} on hold · {completedTasks}/{totalTasks.length} tasks
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["all", "yours", "claude"].map((f) => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: "4px 12px", background: filter === f ? "rgba(232,168,56,0.15)" : "transparent",
                    border: `1px solid ${filter === f ? "rgba(232,168,56,0.3)" : "rgba(232,168,56,0.08)"}`,
                    borderRadius: 20, color: filter === f ? "#e8a838" : "#6a5f48",
                    fontFamily: "var(--font-mono)", fontSize: 11, cursor: "pointer", transition: "all 0.2s",
                  }}>{f === "all" ? "All" : f === "yours" ? "🧑‍🔧 Yours" : "🤖 Claude"}</button>
                ))}
              </div>
            </div>

            {/* Active project cards */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
              {filteredActive.map((project) => (
                <ProjectCard key={project.id} project={project} isExpanded={expandedId === project.id}
                  onExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                  onToggleTask={(trackId, taskId) => toggleTask(project.id, trackId, taskId)}
                  onAction={handleProjectAction} />
              ))}
            </div>

            {filteredActive.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#5a5040", fontFamily: "var(--font-mono)", fontSize: 14 }}>
                No active projects match this filter.
              </div>
            )}

            {/* On Hold drawer */}
            <ShelfDrawer projects={onHoldProjects} label="On Hold" icon="⏸️" color="#e8a838"
              onAction={handleProjectAction} isOpen={showOnHold} onToggle={() => setShowOnHold(!showOnHold)} />

            {/* Archived drawer */}
            <ShelfDrawer projects={archivedProjects} label="Archived" icon="📦" color="#8899aa"
              onAction={handleProjectAction} isOpen={showArchived} onToggle={() => setShowArchived(!showArchived)} />
          </>
        )}
      </div>

      {/* Modals */}
      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onAdd={(p) => setProjects((prev) => [...prev, p])} />}
      {holdTarget && <HoldModal project={holdTarget} onConfirm={confirmHold} onClose={() => setHoldTarget(null)} />}
      {deleteTarget && <DeleteModal project={deleteTarget} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}
