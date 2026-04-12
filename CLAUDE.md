# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# From the repo root - runs client (5180) and server (3010) concurrently
npm run dev

# Build all workspaces
npm run build

# Run all tests (Vitest)
npm test

# Run tests for a single workspace
npm test -w client
npm test -w server

# Run a single test file
npx vitest run -w client src/components/Pins/BriefingPin.test.tsx
npx vitest run -w server src/app.test.ts

# Run tests with coverage
npm run test:coverage -w client

# Token management
npm run token:rotate   # Generate new token in .env
npm run token:show     # Print current token

# Production with PM2
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
npm run pm2:logs
```

## Architecture

Monorepo with npm workspaces:
- **client/** - React 18 + Vite frontend
- **server/** - Express + Socket.io backend with SQLite (better-sqlite3)
- **shared/** - TypeScript types (`types.ts`) shared between client and server

### State Management

Client uses custom hooks — no Redux or Context:
- **`useSocket`** — manages all pin state, Socket.io connection, reconnection, and emits (`pin:complete`, `pin:dismiss`, `pins:request`)
- **`useProjects`** — manages project state via Socket.io; exposes computed filters (`activeProjects`, `onHoldProjects`, `archivedProjects`, `cellarProjects`) and methods (`createProject`, `updateProject`, `holdProject`, `resumeProject`, `archiveProject`, `cellarProject`, `createCellarProject`)
- **`useFocusMode`** — localStorage-based zen mode toggle
- **`usePinEdit`** — inline editing state for Task and Note pins (edit mode, draft values, save/cancel lifecycle, blur/click race handling)

### Real-time Communication

Every REST mutation broadcasts via Socket.io to sync all clients:
- Pin events: `pins:sync`, `pin:created`, `pin:updated`, `pin:deleted`
- Project events: `projects:sync`, `project:created`, `project:updated`, `project:deleted`

### Pin System

Pin types: `task | note | link | event | alert | email | opportunity | briefing | github | idea | tracking | article | twitter | reddit | youtube`  
Defined in `shared/types.ts`, validated in `server/src/validation.ts`, rendered via matching components in `client/src/components/Pins/`.  
Pin status: `active | completed | snoozed | dismissed`. Priority: `1` (high) | `2` (medium) | `3` (low).

**Inline editing** — Task and Note pins support double-click-to-edit on the title. This enters inline edit mode where the title becomes an input and content becomes a textarea. Save via Ctrl+Enter, blur, or the Save button; cancel via Escape. The `usePinEdit` hook manages all edit state and calls `PATCH /api/pins/:id` directly (same fire-and-forget pattern as checklist toggles). Checklist items use `stopPropagation` on double-click so rapid checkbox clicks don't trigger edit mode.

**Adding a new pin type** requires changes in 4 places:
1. `shared/types.ts` — add to `PinType` union and `Pin` interface (with any type-specific fields)
2. `server/src/validation.ts` — add to `PIN_TYPES` array and any validation logic
3. `client/src/components/Pins/` — create `{TypeName}Pin.tsx` + `{TypeName}Pin.css`
4. `client/src/App.tsx` — import and register in the component map

### Project System

Kanban-style pipeline with status: `active | on-hold | archived | cellar`.

- Project phases: `concept | build | polish | publish | shipped`
- Track owners: `claude | you | shared`; track status: `active | waiting | done | locked`
- When a track moves to `done`, the server can auto-create a bridge task pin for the next handoff

**Components:**
- **ProjectPipeline** — main view, slide container with board and cellar panels
- **ProjectCard / ProjectDetailModal / ProjectDetailView** — CRUD and task management
- **CellarView / CellarCard** — "someday/maybe" storage for future project ideas (slide-in from right)
- The pipeline container is `width: 200%`; toggling `.pipeline-stage--cellar` applies `translateX(-50%)` with a cubic-bezier transition

`MenuAction` type (`'hold' | 'resume' | 'archive' | 'delete' | 'cellar'`) is passed uniformly across ProjectCard, ProjectDetailView, and CellarCard.

### Database

SQLite with soft deletes. Schema and migrations in `server/src/db.ts`, database at `server/data/corkboard.db`.  
Server uses prepared statements (`server/src/pins.ts`, `server/src/projects.ts`).

### CSS Patterns

Vanilla CSS files per component — no CSS-in-JS. CSS custom properties (`--board-bg`, `--pin-bg`, `--project-color`, etc.) for theming. Slide panels use `transform: translateX()` animations.

### Dev Proxy

Vite proxies `/api` and `/socket.io` to Express (port 3010) in dev — no CORS configuration needed locally.

### Testing

Both workspaces use Vitest with `globals: true` — no explicit `import { describe, it, expect }` needed. Client tests run under jsdom with React Testing Library; server tests use Supertest against an isolated temp SQLite database.

### Utility Functions

Reusable helpers in `client/src/utils/`:
- `dateUtils.ts` — `formatTimeAgo()`, `formatEmailDate()`
- `pinUtils.ts` — `getRotation(id)` for deterministic pin tilt derived from pin ID
- `lampUtils.ts` — `parseLampState()` with states `waiting | idle | attention | urgent | success | off`
- `urlUtils.ts` — `getSafeHttpUrl()`, `openSafeExternalUrl()`
- `pinContentUtils.ts` — shared checklist parsing/serialization (`parseContent`, `serializeContent`, `toggleChecklistItem`) used by TaskPin and NotePin

## API Endpoints

**Pins**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/pins` | Get all active pins |
| GET | `/api/pins/:id` | Get a single pin |
| POST | `/api/pins` | Create pin (requires `type`, `title`) |
| PATCH | `/api/pins/:id` | Update pin |
| DELETE | `/api/pins/:id` | Soft delete |
| GET | `/api/pins/history/deleted` | Deleted pins history |
| POST | `/api/pins/:id/restore` | Restore deleted pin |

**Projects**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/projects` | Get all projects |
| GET | `/api/projects/:id` | Get a single project |
| POST | `/api/projects` | Create project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Soft delete |
| POST | `/api/projects/:id/restore` | Restore deleted project |
| POST | `/api/projects/:id/hold` | Put on hold |
| POST | `/api/projects/:id/resume` | Resume to active |
| POST | `/api/projects/:id/archive` | Archive |
| POST | `/api/projects/:id/cellar` | Move to cellar |

**Tracks** (nested under projects)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/projects/:id/tracks` | Add a track |
| PATCH | `/api/projects/:id/tracks/:trackId` | Update track (metadata, tasks, attachment) |
| DELETE | `/api/projects/:id/tracks/:trackId` | Delete a track |
| POST | `/api/projects/:id/tracks/reorder` | Reorder tracks |
| POST | `/api/projects/:id/tracks/:trackId/tasks/:taskId/toggle` | Toggle a task |

**Lamp** (optional IoT integration)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/lamp/status` | Get current lamp state / backend availability |
| POST | `/api/lamp/:state` | Set state: `waiting`, `idle`, `attention`, `urgent`, `success`, `off` |

## Environment Variables

Server reads from the repo-root `.env` when present outside test runs:
```
PORT=3010
CORKBOARD_HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5180,http://127.0.0.1:5180

# Authentication — auto-generated on first `npm run dev` / `build` / `pm2:start`
CORKBOARD_TOKEN=<64-char hex>
# CORKBOARD_AUTH=disabled    # opt-out, only behind a reverse-proxy auth layer

# Optional: Home Assistant lamp control
HA_URL=http://192.168.1.100:8123
HA_TOKEN=...
HA_LIGHT_ENTITY=light.my_light
# OR: external lamp server
LAMP_SERVER=http://192.168.1.100:3011
```

Client also reads from the repo-root `.env` (via `envDir: '../'` in
`client/vite.config.ts`):
```
VITE_API_URL=             # Empty = same-origin (default for dev via proxy and prod via static serve)
VITE_SOCKET_URL=
VITE_CORKBOARD_TOKEN=     # Auto-set to match CORKBOARD_TOKEN by scripts/ensure-token.mjs
```

The client token is inlined into the JS bundle at build time, so rotating
`CORKBOARD_TOKEN` requires both a server restart and `npm run build` to make
browsers pick it up.

## Authentication

- Server middleware in `server/src/auth.ts` mounted via `app.use('/api', requireToken)`
  in `server/src/app.ts`. Reads `process.env.CORKBOARD_TOKEN` per request (NOT cached
  at module load — keep this property if you refactor, otherwise tests break).
- Socket.io handshake guard via `io.use(requireSocketToken)`. Rejects with
  `connect_error` on bad/missing token.
- Static files (`express.static`) and the SPA catch-all `app.get('*', ...)` stay
  unauthenticated so the HTML shell can load.
- `CORKBOARD_AUTH=disabled` bypasses both REST and Socket.io middleware.
- All client REST calls go through `client/src/utils/apiFetch.ts`, which auto-attaches
  the bearer header and surfaces 401 via `window.dispatchEvent('corkie:auth-error')`.

## Key Files

- `server/src/app.ts` — Express routes, Socket.io setup, auth middleware mount
- `server/src/auth.ts` — REST + Socket.io auth middleware
- `server/src/db.ts` — Schema, migrations, database initialization
- `server/src/pins.ts` / `server/src/projects.ts` — CRUD with prepared statements
- `client/src/hooks/useSocket.ts` — Pin state management and real-time sync
- `client/src/hooks/useProjects.ts` — Project state management and real-time sync
- `client/src/hooks/usePinEdit.ts` — Inline editing hook for Task and Note pins
- `client/src/utils/apiFetch.ts` — Central fetch wrapper with auth header injection
- `client/src/components/Board/Board.tsx` — Main corkboard grid
- `client/src/components/Projects/ProjectPipeline.tsx` — Kanban pipeline + cellar slide panel
- `scripts/ensure-token.mjs` — First-run token generator (predev/prebuild/prepm2:start hook)
- `shared/types.ts` — All shared TypeScript types

## OpenClaw Skill

The `skill/` directory contains a bundled OpenClaw skill that lets external agents (or shell scripts) post and manage board items via the API.

- `skill/SKILL.md` — Skill definition and usage guide for AI agents
- `skill/scripts/corkboard.sh` — CLI helper that auto-loads `CORKBOARD_TOKEN` from `.env`
- `skill/scripts/install.sh` — First-time installer
- `skill/references/` — API, setup, and pin-type reference docs

## Other Directories

- **`carls_corkie_demo/`** — Remotion video project for marketing/demo scenes. Separate from the main app; pin components there are video-adapted copies, not shared code. Divergence from `client/` is intentional.

