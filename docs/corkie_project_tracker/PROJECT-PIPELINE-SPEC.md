# Project Pipeline — Implementation Spec for Carl's Corkie

## What This Document Is

This is a complete implementation guide for adding a **Project Pipeline** feature to the existing Carl's Corkie corkboard dashboard. It's written for Claude Code to execute against the `carl/dashboard` repository. A working interactive prototype exists and is referenced throughout — the prototype was iterated on extensively and represents the final desired UX.

---

## Context & Motivation

The corkboard currently handles real-time pins — alerts, tasks, notes, emails, etc. These are ephemeral, "right now" items. The Project Pipeline adds a second view for **multi-track maker projects** that span days or weeks, where work happens in parallel between the user and Claude.

**Core problem it solves:** The user builds things (FPV drones, lamps, e-bikes, firmware) where Claude handles code while the user handles physical fabrication (3D printing, CNC, wiring). Currently there's no shared surface showing what each party should be working on. Projects stall in the gap between "code is done" and "case needs designing" because there's no momentum bridge.

**Key design principles:**
- Projects live on a **separate view** from the main pin board, toggled via a header button (like Focus mode)
- Active projects show **parallel tracks** with clear ownership (Claude vs. You vs. Shared)
- Projects that are blocked (waiting for parts, etc.) can be **put on hold** with a reason, removing them from the active view entirely
- Completed or shelved projects can be **archived**
- When a track completes, the system should be able to **auto-create a pin** on the main board alerting the user it's their turn

---

## Architecture Overview

This feature integrates into the existing monorepo structure:

```
dashboard/
├── client/          # React 18 + Vite
│   └── src/
│       ├── components/
│       │   ├── Board/           # Existing pin board
│       │   ├── Pins/            # Existing pin type components
│       │   └── Projects/        # NEW — project pipeline components
│       └── hooks/
│           ├── useSocket.ts     # Existing — needs view toggle state
│           └── useProjects.ts   # NEW — project state management
├── server/          # Express + Socket.io + SQLite
│   └── src/
│       ├── app.ts              # Existing — add project routes
│       ├── pins.ts             # Existing — no changes needed
│       └── projects.ts         # NEW — project CRUD
└── shared/
    └── types.ts                # Existing — add project types
```

---

## Data Model

### Shared Types (`shared/types.ts`)

Add the following types alongside the existing pin types:

```typescript
// ─── Project Pipeline Types ──────────────────────────────

export type ProjectPhase = 'concept' | 'build' | 'polish' | 'publish' | 'shipped';
export type ProjectStatus = 'active' | 'on-hold' | 'archived';
export type TrackOwner = 'claude' | 'you' | 'shared';
export type TrackStatus = 'active' | 'waiting' | 'done' | 'locked';

export interface ProjectTask {
  id: string;
  text: string;
  done: boolean;
}

export interface TrackAttachment {
  type: 'code' | 'image' | 'file' | 'link';
  label: string;
  note: string;
  url?: string;          // optional link to file/resource
}

export interface ProjectTrack {
  id: string;
  name: string;          // e.g. "Firmware", "3D Case", "Script & Content"
  owner: TrackOwner;
  status: TrackStatus;
  tasks: ProjectTask[];
  attachment: TrackAttachment | null;
  sortOrder: number;
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;         // hex color, e.g. "#e8a838"
  phase: ProjectPhase;
  projectStatus: ProjectStatus;
  holdReason: string;    // populated when status is 'on-hold'
  createdAt: string;     // ISO date
  updatedAt: string;     // ISO date
  tracks: ProjectTrack[];
}
```

### Database Schema (`server/src/db.ts`)

Add two new tables. Follow the existing pattern of using `better-sqlite3` with prepared statements.

```sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🔧',
  color TEXT DEFAULT '#e8a838',
  phase TEXT DEFAULT 'concept' CHECK(phase IN ('concept','build','polish','publish','shipped')),
  project_status TEXT DEFAULT 'active' CHECK(project_status IN ('active','on-hold','archived')),
  hold_reason TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS project_tracks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner TEXT DEFAULT 'you' CHECK(owner IN ('claude','you','shared')),
  status TEXT DEFAULT 'waiting' CHECK(status IN ('active','waiting','done','locked')),
  tasks TEXT DEFAULT '[]',           -- JSON array of ProjectTask objects
  attachment TEXT DEFAULT NULL,      -- JSON string of TrackAttachment or null
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Notes:**
- Follow the existing soft-delete pattern (using `deleted_at`) from the pins table
- `tasks` and `attachment` are stored as JSON strings (SQLite JSON) — same pattern used elsewhere in the codebase
- Timestamps use SQLite `datetime('now')` format

---

## API Endpoints

Add these to `server/src/app.ts`. Create a new `server/src/projects.ts` module for the CRUD operations, following the same pattern as `server/src/pins.ts` (prepared statements, etc.).

### Project CRUD

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/projects` | Get all non-deleted projects with their tracks |
| `GET` | `/api/projects/:id` | Get single project with tracks |
| `POST` | `/api/projects` | Create a new project (with initial tracks) |
| `PATCH` | `/api/projects/:id` | Update project metadata (name, emoji, color, phase, status, holdReason) |
| `DELETE` | `/api/projects/:id` | Soft delete project |
| `POST` | `/api/projects/:id/restore` | Restore soft-deleted project |

### Track CRUD

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/projects/:id/tracks` | Add a track to a project |
| `PATCH` | `/api/projects/:id/tracks/:trackId` | Update track (status, tasks, attachment) |
| `DELETE` | `/api/projects/:id/tracks/:trackId` | Remove a track |

### Project Status Actions (convenience endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/projects/:id/hold` | Put project on hold (body: `{ reason: string }`) |
| `POST` | `/api/projects/:id/resume` | Resume project from on-hold or archived |
| `POST` | `/api/projects/:id/archive` | Archive project |

### Track Task Toggle

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/projects/:id/tracks/:trackId/tasks/:taskId/toggle` | Toggle a task's done status |

**Request/Response Patterns:**

Creating a project (POST `/api/projects`):
```json
{
  "name": "FPV Proximity Alert",
  "emoji": "📡",
  "color": "#e8a838",
  "phase": "concept",
  "tracks": [
    { "name": "Firmware", "owner": "claude" },
    { "name": "3D Case", "owner": "you" },
    { "name": "Publish", "owner": "shared" }
  ]
}
```

The server should:
- Generate a UUID for the project and each track
- Set the first track to `status: "active"`, rest to `"waiting"`
- Set `sort_order` based on array position
- Return the full project with tracks

Putting on hold (POST `/api/projects/:id/hold`):
```json
{
  "reason": "Waiting for BMS breakout board from AliExpress (~2 weeks)"
}
```

---

## Socket.io Events

Follow the existing Socket.io pattern from pins. Every REST mutation should also broadcast via Socket.io.

### Client → Server
| Event | Payload | Purpose |
|-------|---------|---------|
| `projects:request` | — | Request full project list |
| `project:task:toggle` | `{ projectId, trackId, taskId }` | Toggle task completion |

### Server → Client (broadcasts)
| Event | Payload | Purpose |
|-------|---------|---------|
| `projects:sync` | `Project[]` | Full project list sync |
| `project:created` | `Project` | New project created |
| `project:updated` | `Project` | Project or track updated |
| `project:deleted` | `{ id: string }` | Project deleted |

---

## Client Components

### New Files to Create

```
client/src/
├── components/
│   └── Projects/
│       ├── ProjectPipeline.tsx      # Main container (replaces Board when toggled)
│       ├── ProjectCard.tsx          # Individual project card
│       ├── TrackCard.tsx            # Track within a project card
│       ├── PhaseIndicator.tsx       # The concept→build→polish→publish→shipped dots
│       ├── ProgressBar.tsx          # Reusable progress bar
│       ├── ProjectMenu.tsx          # ⋮ context menu (hold/archive/delete)
│       ├── ShelfDrawer.tsx          # Collapsible on-hold / archived sections
│       ├── NewProjectModal.tsx      # Create project form
│       ├── HoldModal.tsx            # Put-on-hold modal with reason
│       ├── DeleteModal.tsx          # Delete confirmation
│       └── Projects.css             # All project pipeline styles
├── hooks/
│   └── useProjects.ts              # Project state + socket sync
```

### Component Hierarchy

```
App
├── Header
│   ├── ...existing buttons...
│   └── ProjectsToggle (📌 Projects — active state when view === 'projects')
├── Board (visible when view === 'board')
│   └── ...existing pin rendering...
└── ProjectPipeline (visible when view === 'projects')
    ├── FilterBar (All / 🧑‍🔧 Yours / 🤖 Claude)
    ├── ProjectCard[] (active projects)
    │   ├── PhaseIndicator
    │   ├── ProgressBar
    │   ├── ProjectMenu (⋮)
    │   └── TrackCard[] (when expanded)
    │       ├── ProgressBar
    │       ├── Task checkboxes
    │       └── Attachment display
    ├── ShelfDrawer (On Hold — collapsed by default)
    │   └── Compact project cards with Resume/Archive/Delete
    └── ShelfDrawer (Archived — collapsed by default)
        └── Compact project cards with Reactivate/Delete
```

### View Toggle Integration

The view toggle should be added to the existing header in `Board.tsx` or wherever the header is rendered. It works identically to Focus mode — a button that toggles state, swapping which content component renders.

In `useSocket.ts` (or a new parent hook), add:
```typescript
const [currentView, setCurrentView] = useState<'board' | 'projects'>('board');
```

The `+ New` button in the header should be context-aware:
- When on board view: creates a new pin (existing behavior)
- When on projects view: opens the New Project modal

---

## Styling

All project styles go in `Projects.css`. Follow the existing CSS patterns in the codebase (plain CSS with CSS variables, no CSS-in-JS).

### Design Tokens (match existing corkboard aesthetic)

```css
/* Project Pipeline Design Tokens */
:root {
  /* These should align with existing corkboard variables */
  --project-bg: linear-gradient(145deg, #2a2215 0%, #1e1a0f 100%);
  --project-border: rgba(232, 168, 56, 0.15);
  --project-text-primary: #e8dcc8;
  --project-text-secondary: #8a7e68;
  --project-text-muted: #6a5f48;
  --project-text-dim: #5a5040;

  --status-done: #4ecdc4;
  --status-active: #e8a838;
  --status-waiting: #8899aa;
  --status-locked: #556677;

  --priority-high: #ff6b6b;
  --priority-med: #e8a838;
  --priority-low: #4ecdc4;

  --font-mono: 'IBM Plex Mono', monospace;
  --font-display: 'Playfair Display', Georgia, serif;
}
```

### Key Visual Details

- **Project cards**: Dark gradient background, colored top border (4px, project color), subtle box shadow
- **Track cards**: Darker background, colored left border (3px, status color), collapsible
- **Phase indicator**: Small dots connected by lines, past phases are teal, current is amber with glow
- **On-hold shelf**: Collapsed by default, cards render at 75% opacity, hold reason shown in amber
- **Archived shelf**: Same as on-hold but with grey accent color
- **Context menu (⋮)**: Positioned absolutely, dark dropdown with hover highlights, delete option separated by divider and colored red
- **Modals**: Centered overlay with blur backdrop, dark card, matching form inputs

---

## Auto-Pin Bridge (Main Board ↔ Projects)

When a project track status changes to `done`, the server should automatically create a pin on the main board:

```typescript
// In server/src/projects.ts, after updating a track to 'done':
import { createPin } from './pins';

function onTrackCompleted(project: Project, completedTrack: ProjectTrack) {
  // Find the next active track owned by the user
  const nextUserTrack = project.tracks.find(
    t => t.owner !== 'claude' && t.status === 'active' && t.id !== completedTrack.id
  );

  const pinTitle = nextUserTrack
    ? `${project.emoji} ${project.name} — your turn: ${nextUserTrack.name}`
    : `${project.emoji} ${project.name} — ${completedTrack.name} complete`;

  createPin({
    type: 'task',
    title: pinTitle,
    body: `Track "${completedTrack.name}" is done. ${nextUserTrack ? `Next up: ${nextUserTrack.name}` : 'Check project for next steps.'}`,
    priority: 2,
    metadata: {
      projectId: project.id,
      sourceTrack: completedTrack.id,
    }
  });

  // Optional: trigger lamp color change
  // broadcastLampEvent('attention');  // purple — something needs attention
}
```

This is the bridge that makes the two views work together — you never have to proactively check the project board. When Claude finishes code, a pin appears on your main board telling you it's your turn to work on the 3D case.

---

## Lamp Integration

When project events happen, the existing lamp system can be triggered:

| Event | Lamp Color | Meaning |
|-------|-----------|---------|
| Track completed (your turn) | Purple (attention) | A track finished, action needed |
| All tracks done (project ready to ship) | Green | Project is ready to publish |
| Project put on hold | — | No lamp change |

This uses the existing Home Assistant integration — no new infrastructure needed.

---

## Webhook Support

The existing webhook pattern for pins should extend to projects. External tools (n8n, Claude Code, scripts) should be able to:

```bash
# Create a project via API
curl -X POST http://localhost:3010/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Drone Build",
    "emoji": "🛸",
    "color": "#c3a6ff",
    "tracks": [
      { "name": "Flight Controller Firmware", "owner": "claude" },
      { "name": "Frame Assembly", "owner": "you" },
      { "name": "Publish", "owner": "shared" }
    ]
  }'

# Update a track (e.g. Claude marks firmware as done)
curl -X PATCH http://localhost:3010/api/projects/proj-123/tracks/t-456 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done",
    "attachment": {
      "type": "code",
      "label": "firmware.ino",
      "note": "v1.0 — gyro calibration complete"
    }
  }'

# Add a task to a track
curl -X PATCH http://localhost:3010/api/projects/proj-123/tracks/t-456 \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      { "id": "task-1", "text": "Implement PID loop", "done": true },
      { "id": "task-2", "text": "Add failsafe", "done": false }
    ]
  }'

# Put a project on hold
curl -X POST http://localhost:3010/api/projects/proj-123/hold \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Waiting for motors from BangGood" }'

# Resume a project
curl -X POST http://localhost:3010/api/projects/proj-123/resume
```

---

## Implementation Order

Recommended sequence to build this out:

### Phase 1: Data layer
1. Add types to `shared/types.ts`
2. Add database tables to `server/src/db.ts`
3. Create `server/src/projects.ts` with CRUD operations (prepared statements)
4. Add routes to `server/src/app.ts`
5. Test all endpoints with curl

### Phase 2: Client — Project Pipeline view
6. Create `useProjects.ts` hook (mirroring `useSocket.ts` pattern)
7. Build `ProjectPipeline.tsx` container
8. Build `ProjectCard.tsx` + `TrackCard.tsx` + `PhaseIndicator.tsx` + `ProgressBar.tsx`
9. Build `NewProjectModal.tsx`
10. Add view toggle to header
11. Verify toggle between board and projects works

### Phase 3: Status management
12. Build `ProjectMenu.tsx` (⋮ dropdown)
13. Build `HoldModal.tsx` + `DeleteModal.tsx`
14. Build `ShelfDrawer.tsx` for on-hold and archived
15. Wire up status transitions (hold, resume, archive, delete)

### Phase 4: Bridge & Integration
16. Implement auto-pin creation when tracks complete
17. Add Socket.io broadcasts for project mutations
18. Wire lamp color triggers for project events
19. Test end-to-end: create project → complete tracks → pin appears on board

### Phase 5: Polish
20. ✅ Add task inline editing (click to add/edit/delete tasks within a track)
21. ✅ Add track reordering (drag handles via @dnd-kit)
22. Animations on view transitions (deferred)
23. Mobile responsive layout (deferred)

---

## Prototype Reference

The interactive prototype built during design lives in the Claude.ai conversation and was exported as `corkie-projects-v2.jsx`. It's a self-contained React component with all the UX patterns, visual design, interactions, and state management worked out. Use it as the definitive reference for how things should look and behave — the component names, layout patterns, and interaction flows are all production-intent.

Key behaviors to preserve from the prototype:
- **Card expand/collapse**: Click card header to toggle track visibility
- **Track expand/collapse**: Click track header to toggle task list
- **Context menu**: ⋮ button opens positioned dropdown, click outside closes
- **Hold modal**: Pre-filled suggestion chips for common hold reasons
- **Delete modal**: Warns about permanence, suggests archiving instead
- **Shelf drawers**: Collapsed by default, show count badge, cards at reduced opacity
- **Filter pills**: All / Yours / Claude — filter active projects by track ownership
- **Phase dots**: Connected by lines, past=teal, current=amber with glow, future=dark
- **Progress bars**: Per-track and per-project aggregate, smooth width transition
- **Locked tracks**: 50% opacity, no expand, lock icon with "unlocks when previous tracks complete"
- **Focus summary**: When expanded, shows "Your focus → [track]" and "Claude's working on → [track]" at top

---

## Testing Checklist

After implementation, verify:

- [ ] Projects view toggles cleanly from main board via header button
- [ ] Header button shows active state when in projects view
- [ ] `+ New` creates projects when in projects view, pins when in board view
- [ ] Create project with multiple tracks — first track auto-set to active
- [ ] Task checkboxes toggle and persist
- [ ] Track auto-marks as "done" when all tasks completed
- [ ] Put project on hold with reason — disappears from active, appears in On Hold shelf
- [ ] Resume project from on hold — returns to active, hold reason cleared
- [ ] Archive project — disappears from active, appears in Archived shelf
- [ ] Delete project — confirmation modal, then permanent removal
- [ ] Filter pills correctly filter by track ownership
- [ ] All changes broadcast via Socket.io to other connected clients
- [ ] Auto-pin created on main board when a track completes
- [ ] API endpoints work for external tools (curl tests)
- [ ] Data persists across server restarts (SQLite)

---

## Files Changed Summary

| File | Action | What |
|------|--------|------|
| `shared/types.ts` | Modify | Add project-related type definitions |
| `server/src/db.ts` | Modify | Add `projects` and `project_tracks` tables |
| `server/src/projects.ts` | **Create** | Project CRUD with prepared statements |
| `server/src/app.ts` | Modify | Add project API routes and Socket.io events |
| `client/src/components/Projects/` | **Create** | All project pipeline components (10 files) |
| `client/src/components/Projects/Projects.css` | **Create** | Project pipeline styles |
| `client/src/hooks/useProjects.ts` | **Create** | Project state management hook |
| `client/src/hooks/useSocket.ts` | Modify | Add view toggle state |
| `client/src/components/Board/Board.tsx` | Modify | Add Projects toggle button to header, conditional rendering |
