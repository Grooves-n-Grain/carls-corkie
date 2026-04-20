# Advanced

Architecture, full API reference, lamp integration, and development notes.

## Architecture

Monorepo with npm workspaces:

```
carls-corkie/
  client/       React 18 + Vite + TypeScript
  server/       Express + Socket.io + SQLite (better-sqlite3)
  shared/       TypeScript types shared between client and server
```

- **Real-time:** Socket.io for bidirectional updates. REST mutations also broadcast via WebSocket.
- **Database:** SQLite with WAL mode. Soft deletes. No external DB needed.
- **Styling:** Plain CSS with CSS variables (easy to theme).
- **State:** Custom hooks (`useSocket`, `useProjects`, `useFocusMode`, `usePinEdit`) — no Redux, no Context overhead.

## Project pipeline

Projects are the long-lived side of the dashboard: a shared surface for work that moves between you and the agent.

Each project is broken into **tracks** — the different pieces of the work happening at the same time. Think of a track like a lane on the highway: it has its own owner (you, Claude, or both), its own status, and its own little to-do list, so at a glance you can see who's doing what right now and what's waiting on someone else.

- Project phases: `concept` | `build` | `polish` | `publish` | `shipped`
- Project status: `active` | `on-hold` | `archived` | `cellar`
- Track owners: `claude` | `you` | `shared`
- Track status: `active` | `waiting` | `done` | `locked`

When a track moves to `done`, the server can automatically create a bridge task pin so the next handoff appears on the board instead of getting lost in chat.

## API

Pins and projects are managed through a REST API. Your AI assistant, scripts, or automations can create and manage both. All routes require the bearer token unless auth is disabled — see [DEPLOYMENT.md](DEPLOYMENT.md#authentication).

### Pin routes

| Method | Endpoint | What it does |
|--------|----------|-------------|
| GET | `/api/pins` | Get all non-deleted pins |
| GET | `/api/pins/:id` | Get a single pin |
| POST | `/api/pins` | Create a pin |
| PATCH | `/api/pins/:id` | Update a pin |
| DELETE | `/api/pins/:id` | Soft delete a pin |
| GET | `/api/pins/history/deleted` | Get recently deleted pins |
| POST | `/api/pins/:id/restore` | Restore a deleted pin |

### Project routes

| Method | Endpoint | What it does |
|--------|----------|-------------|
| GET | `/api/projects` | Get all non-deleted projects |
| GET | `/api/projects/:id` | Get a single project |
| POST | `/api/projects` | Create a project |
| PATCH | `/api/projects/:id` | Update project metadata |
| DELETE | `/api/projects/:id` | Soft delete a project |
| POST | `/api/projects/:id/restore` | Restore a deleted project |
| POST | `/api/projects/:id/hold` | Put a project on hold |
| POST | `/api/projects/:id/resume` | Move project back to active |
| POST | `/api/projects/:id/archive` | Archive a project |
| POST | `/api/projects/:id/cellar` | Move a project into the Cellar |

### Track routes

| Method | Endpoint | What it does |
|--------|----------|-------------|
| POST | `/api/projects/:id/tracks` | Add a track |
| PATCH | `/api/projects/:id/tracks/:trackId` | Update track metadata, tasks, or attachment |
| DELETE | `/api/projects/:id/tracks/:trackId` | Delete a track |
| POST | `/api/projects/:id/tracks/reorder` | Reorder tracks |
| POST | `/api/projects/:id/tracks/:trackId/tasks/:taskId/toggle` | Toggle a task |

### Lamp routes

| Method | Endpoint | What it does |
|--------|----------|-------------|
| GET | `/api/lamp/status` | Get current lamp state / backend availability |
| POST | `/api/lamp/:state` | Set `waiting`, `idle`, `attention`, `urgent`, `success`, or `off` |

### Creating a pin

> Examples below assume `CORKBOARD_TOKEN` is exported in your shell. See [DEPLOYMENT.md](DEPLOYMENT.md#authentication) for how to obtain it.

```bash
curl -X POST http://localhost:3010/api/pins \
  -H "Authorization: Bearer $CORKBOARD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"task","title":"Review the PR","priority":1}'
```

### Creating different pin types

```bash
# Link pin
curl -X POST http://localhost:3010/api/pins \
  -H "Authorization: Bearer $CORKBOARD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"link","title":"Check this out","url":"https://example.com"}'

# Event with a due date (dueAt is any ISO 8601 timestamp)
curl -X POST http://localhost:3010/api/pins \
  -H "Authorization: Bearer $CORKBOARD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"event","title":"Standup in 15 minutes","dueAt":"<ISO-8601-timestamp>"}'
```

All changes broadcast over WebSocket in real-time, so every connected client updates instantly.

## IoT lamp integration

The dashboard has lamp buttons in the footer that reflect the board state through a real-world light. Each button fires an HTTP call to whatever lamp backend you point corkie at, and maps to a color preset:

| State | Color | Use case |
|-------|-------|----------|
| Waiting | Amber | AI is thinking/processing |
| Idle | Cyan | All clear, nothing urgent |
| Attention | Purple | Something needs your attention |
| Urgent | Red | Drop what you're doing |
| Success | Green | Project complete / ready to ship |
| Off | — | Lamp off |

You've got two ways to hook this up:

- **Through Home Assistant** — set `HA_URL`, `HA_TOKEN`, and `HA_LIGHT_ENTITY` in `.env`. Easiest if you already have HA running and want the lamp to show up alongside your other smart devices.
- **Direct to a lamp server** — set `LAMP_SERVER` to the base URL of anything that accepts `POST /:state`. In my setup that's a WLED controller, but it could just as easily be a custom webhook receiver, a shell script behind nginx, a Node-RED flow, etc. — the buttons are really just webhooks, so point them at whatever you want.

Without either variable set, the lamp buttons are cosmetic only — they won't error, they just won't control anything.

## Development

```bash
npm run dev           # Runs client + server concurrently
npm run dev -w client # Just the frontend (port 5180)
npm run dev -w server # Just the backend (port 3010)
npm test              # Run all tests
npm run build         # Production build
```

The Vite dev server proxies `/api` and `/socket.io` to the Express backend, so no CORS hassle during development. Server tests use an isolated temporary SQLite database, so they do not depend on your local `.env` or app data.