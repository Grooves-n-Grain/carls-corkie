# carl's corkie

A real-time corkboard dashboard built for people whose brains work a little differently. Warm, tactile, ADHD-friendly.

![carl's corkie](client/public/carls-corkie-alt.png)

## Why this exists

ADHD executive dysfunction means:
- Switching contexts to find what you need = lost focus = 20 minutes getting back on track
- Having too many options = paralysis (staring at a light switch for 20 minutes knowing you need to flip it)
- Traditional todo lists become graveyards of good intentions

This dashboard flips that on its head. Instead of *you* managing a todo list, your AI assistant manages a board for you. It posts what you need to do *right now*. Not a list of maybes — if it's on the board, it needs doing.

**Key principle:** No maybes, no options, no "consider this later." The board shows what's actionable.

## What it does

- Real-time corkboard pins for tasks, alerts, links, notes, briefings, opportunities, package tracking, article summaries, and social previews
- Multi-track project pipeline for shared human/agent work
- Cellar view for future ideas that should stay off the active board until they are ready
- Focus Mode for one-thing-at-a-time execution
- Optional lamp integration through Home Assistant or an external lamp server
- Bundled OpenClaw skill for posting and managing board items from an agent workflow

## Quick start

```bash
git clone https://github.com/zheroz00/carls-corkie.git
cd carls-corkie
npm install
npm run dev
```

Dashboard opens at **http://localhost:5180**. API at **http://localhost:3010**.
On the same LAN, dev mode is also reachable at **http://<your-lan-ip>:5180**.

That's it. SQLite is embedded, no external database to set up. On first run the
app generates a random `CORKBOARD_TOKEN` in `.env` (gitignored) and bakes the
matching `VITE_CORKBOARD_TOKEN` into the client bundle, so authentication just
works out of the box. See [Authentication](#authentication) below if you need
to rotate, share, or disable it.

## Configuration

Copy `.env.example` to `.env` and tweak as needed:

```bash
# Server port
PORT=3010
CORKBOARD_HOST=0.0.0.0

# CORS — add your LAN IP if you're accessing the Vite dev server from another device
CORS_ORIGINS=http://localhost:5180,http://127.0.0.1:5180

# Home Assistant lamp integration (optional, see below)
# HA_URL=http://192.168.1.100:8123
# HA_TOKEN=your-long-lived-access-token
# HA_LIGHT_ENTITY=light.my_light

# Or use an external lamp server instead
# LAMP_SERVER=http://192.168.1.100:3011

# Client — leave empty for same-origin (recommended for most setups)
VITE_API_URL=
VITE_SOCKET_URL=
```

### Accessing from other devices on your LAN

The backend binds to `0.0.0.0` by default, so the production server is reachable on both `localhost` and your machine's LAN IP. For Vite dev access on another device, add your machine's LAN IP to `CORS_ORIGINS`:
```
CORS_ORIGINS=http://localhost:5180,http://192.168.1.50:5180
```

Then open `http://192.168.1.50:5180` from your phone/tablet.

## Authentication

Carl's Corkie is a single-user, self-hosted tool. It ships with a shared bearer
token to keep random scanners and accidental port forwards from poking at your
board, but it is **not** a multi-user permission system.

**On first run**, `npm run dev` (or `npm run build`, or `npm run pm2:start`)
generates a random hex token and writes it into both `CORKBOARD_TOKEN` and
`VITE_CORKBOARD_TOKEN` in `.env`. The server reads the first; the client bundle
inlines the second at build time. They must match. `.env` is gitignored.

You should not need to do anything for the happy path — it just works.

### Sending requests as an external tool

The bundled `skill/scripts/corkboard.sh` reads `CORKBOARD_TOKEN` from your shell
env or from `.env` in the current directory automatically. If you're hand-rolling
curl, include the bearer header:

```bash
export CORKBOARD_API="http://localhost:3010"
export CORKBOARD_TOKEN="$(grep '^CORKBOARD_TOKEN=' .env | cut -d= -f2-)"

curl -X POST "$CORKBOARD_API/api/pins" \
  -H "Authorization: Bearer $CORKBOARD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"task","title":"Hello"}'
```

### Rotating the token

```bash
npm run token:rotate     # generate a new token in .env
npm run pm2:restart      # (or restart your dev server)
npm run build            # rebuild the client so the new token is baked in
```

External senders will need the new value too — re-source `.env` or update your
shell env.

### Showing the current token

```bash
npm run token:show
```

### Disabling auth (only behind a reverse proxy)

If you terminate auth at a reverse proxy (Tailscale, Authelia, Cloudflare Access,
nginx basic auth), you can opt out of the built-in token check by setting
`CORKBOARD_AUTH=disabled` in `.env`. The server will print a loud warning on
startup. **Do not do this if your dashboard is reachable from the internet
without another auth layer in front of it.**

### Exposing only the API (advanced, reverse-proxy blueprint)

Some people want the dashboard to stay LAN-only but still let external services
(webhooks, automation, remote scripts) post pins over the internet. This is not
a built-in feature — corkie is a single process that serves both the API and
the frontend — but any reverse proxy in front of corkie can enforce a path
filter that blocks everything except `/api/*`. The frontend then becomes
unreachable from the public hostname even though it's still running on the LAN.

A minimal nginx location block (works in Nginx Proxy Manager, Caddy, or raw
nginx) looks like:

```nginx
location / {
    return 404;
}

location /api/ {
    proxy_pass http://<corkie-lan-ip>:3010;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Point a public hostname (Cloudflare Tunnel, ngrok, Caddy + Let's Encrypt, your
choice) at that reverse proxy. Anyone hitting `https://your-hostname/` gets a
404; only `/api/*` paths make it through, and they still have to pass the
bearer-token check at corkie. Your LAN dashboard keeps working unchanged, and
because corkie is still one process with one Socket.io instance, pins posted
via the tunnel appear on the LAN dashboard in real-time.

This is a pattern, not a feature. We don't ship it, we don't support your
particular reverse-proxy choice, and if you get this wrong you can expose the
dashboard to the internet — so test from an external device (phone on cellular
works) before trusting it. **You are responsible for your own perimeter.**

### Security model — the small print

- The token is baked into the client JS bundle and visible in browser DevTools.
  Anyone who can load the dashboard URL gets a copy of the token. This is
  expected: the token gates the API at the network layer, not per-user.
- For real "family member can view, only I can edit" semantics you need a real
  identity layer (cookies, OAuth, SSO). That's outside the scope of this repo.
- TLS is your responsibility. Run the dashboard behind a reverse proxy with HTTPS
  if it's reachable from anywhere you don't fully trust. The token rides in plain
  HTTP headers.

## Pin types

Pins are the core unit. Each type has its own look and behavior:

| Type | What it's for |
|------|--------------|
| `task` | Action items with priority levels and checklists |
| `note` | Reference info — not actionable, just context |
| `link` | URLs you need to visit (clickable, opens in new tab) |
| `event` | Time-sensitive reminders with due dates |
| `alert` | Urgent notifications — build failures, server down, etc. |
| `email` | Email summaries with a link to open in Gmail |
| `briefing` | Daily briefings or summaries from your AI assistant |
| `github` | GitHub repo cards with star/fork counts |
| `idea` | Business/project ideas with viability scoring |
| `tracking` | Package tracking with carrier detection |
| `article` | Article summaries with a built-in reader modal |
| `twitter` | Twitter/X post previews |
| `reddit` | Reddit post previews |
| `opportunity` | Opportunities flagged from email or other sources |

Pin status: `active` | `completed` | `snoozed` | `dismissed`

Priority levels: `1` = high (red), `2` = medium (amber), `3` = low (green)

## Project pipeline

Projects are the long-lived side of the dashboard: a shared surface for work that moves between you and the agent.

- Project phases: `concept` | `build` | `polish` | `publish` | `shipped`
- Project status: `active` | `on-hold` | `archived` | `cellar`
- Track owners: `claude` | `you` | `shared`
- Track status: `active` | `waiting` | `done` | `locked`

When a track moves to `done`, the server can automatically create a bridge task pin so the next handoff appears on the board instead of getting lost in chat.

### The Cellar

The Cellar is the "someday, but worth keeping" space. It is separate from:

- `active`: work happening now
- `on-hold`: paused because something is blocked
- `archived`: finished work
- `cellar`: future ideas that are aging until they are ready

## API

Pins and projects are managed through a REST API. Your AI assistant, scripts, or automations can create and manage both.

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

> All examples below assume `CORKBOARD_TOKEN` is exported in your shell. See
> [Authentication](#authentication) for how to obtain it from your `.env`.

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

# Event with a due date
curl -X POST http://localhost:3010/api/pins \
  -H "Authorization: Bearer $CORKBOARD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"event","title":"Standup in 15 minutes","dueAt":"2025-01-15T09:00:00Z"}'
```

All changes broadcast over WebSocket in real-time, so every connected client updates instantly.

## Focus Mode

When you're overwhelmed, hit the Focus button. The board collapses to show **one pin at a time** — the highest priority active item. Complete it, and the next one appears. No wall of tasks staring you down.

## OpenClaw skill

This repo includes a bundled OpenClaw skill in `skill/`.

For first-time installs, point the installer at this repo:

```bash
export CORKBOARD_REPO="https://github.com/zheroz00/carls-corkie.git"
bash skill/scripts/install.sh
```

Or use the helper directly against a running instance:

```bash
export CORKBOARD_API="http://localhost:3010"
# CORKBOARD_TOKEN is auto-loaded from .env if you run from the repo root.
# Otherwise: export CORKBOARD_TOKEN="$(grep '^CORKBOARD_TOKEN=' /path/to/.env | cut -d= -f2-)"
bash skill/scripts/corkboard.sh add task "Review PR" "Auth refactor complete" 1
```

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
- **State:** Custom hooks (`useSocket`, `useFocusMode`) — no Redux, no Context overhead.

## IoT lamp integration (optional)

If you use Home Assistant, you can wire up a desk lamp that reflects the board state. The dashboard has lamp control buttons in the footer that map to color presets:

| State | Color | Use case |
|-------|-------|----------|
| Waiting | Amber | AI is thinking/processing |
| Idle | Cyan | All clear, nothing urgent |
| Attention | Purple | Something needs your attention |
| Urgent | Red | Drop what you're doing |
| Success | Green | Project complete / ready to ship |
| Off | — | Lamp off |

Set `HA_URL`, `HA_TOKEN`, and `HA_LIGHT_ENTITY` in your `.env` to enable this. Without these, the lamp buttons are cosmetic only (they won't error, they just won't control anything).

## Running in production with PM2

```bash
npm run pm2:start    # Start both server and client
npm run pm2:stop     # Stop everything
npm run pm2:restart  # Restart
npm run pm2:logs     # Tail logs
```

PM2 config is in `ecosystem.config.cjs`.

## Development

```bash
npm run dev           # Runs client + server concurrently
npm run dev -w client # Just the frontend (port 5180)
npm run dev -w server # Just the backend (port 3010)
npm test              # Run all tests
npm run build         # Production build
```

The Vite dev server proxies `/api` and `/socket.io` to the Express backend, so no CORS hassle during development.
Server tests use an isolated temporary SQLite database, so they do not depend on your local `.env` or app data.

## Roadmap

- [ ] Mobile responsive layout
- [ ] Sound/notification options
- [ ] Pin drag-and-drop reordering
- [ ] Themes beyond the default cork aesthetic

## License

MIT — enjoy.
