# Setup Guide

## Prerequisites

- Node.js 20+
- npm 10+
- `jq`, `curl`, and `git` for the bundled CLI and installer
- PM2 is optional

SQLite is embedded. No external database is required.

## Install

Fast path:
```bash
bash {baseDir}/scripts/install.sh
```

Manual path:
```bash
git clone https://github.com/zheroz00/carls-corkie.git carls-corkie
cd carls-corkie
cp .env.example .env
npm install
npm run build
```

The installer defaults to `https://github.com/zheroz00/carls-corkie.git`.
If you use the installer script against a fork, set `CORKBOARD_REPO` first so it clones the right repository instead.

## Environment

Important settings:
```bash
PORT=3010
CORKBOARD_HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5180,http://127.0.0.1:5180

# Optional Home Assistant integration
HA_URL=http://192.168.1.100:8123
HA_TOKEN=your-long-lived-access-token
HA_LIGHT_ENTITY=light.my_light

# Optional external lamp server
LAMP_SERVER=http://192.168.1.100:3011

# Leave empty for same-origin
VITE_API_URL=
VITE_SOCKET_URL=
```

Helper-script environment:
```bash
export CORKBOARD_API="http://localhost:3010"
# Optional: focus window + sound alert helper
export CORKBOARD_ALERT_URL="http://localhost:3011"
```

## LAN Access

- The backend binds to `0.0.0.0` by default, so the production app is reachable at both `http://localhost:3010` and `http://<lan-ip>:3010`.
- The Vite dev server already listens on the LAN. If you open `http://<lan-ip>:5180` from another device during development, add that exact origin to `CORS_ORIGINS`.
- This setup is intended for a trusted local network. Do not expose it directly to the public internet.

Example dev CORS for a phone or tablet on your LAN:
```bash
CORS_ORIGINS=http://localhost:5180,http://127.0.0.1:5180,http://192.168.1.50:5180
```

## Run

Development:
```bash
npm run dev
```

Individual services:
```bash
npm run dev -w server
npm run dev -w client
```

Production / PM2:
```bash
npm run build
npm run pm2:start
npm run pm2:restart
npm run pm2:stop
npm run pm2:logs
```

## CLI Helper

Use the bundled script directly or alias it:
```bash
chmod +x {baseDir}/scripts/corkboard.sh
export CORKBOARD_API="http://localhost:3010"
# or
export CORKBOARD_API="http://<lan-ip>:3010"
```

The helper script is best for posting and managing pins quickly. Use direct REST calls for:
- project CRUD and cellar flows
- deleted-history restore
- track edits, attachments, and reorder
- lamp status and lamp-state changes

## Lamp States

The dashboard supports these lamp states:

| State | Meaning |
|-------|---------|
| `waiting` | Agent is working |
| `idle` | All clear |
| `attention` | Needs attention |
| `urgent` | Urgent issue |
| `success` | Project complete / ready to ship |
| `off` | Lamp off |

## Testing

```bash
npm test
npm run build
```

## Database

- Default file: `server/data/corkboard.db`
- WAL mode is enabled
- Pins and projects use soft deletes where supported
- Deleted pin history is exposed via `/api/pins/history/deleted`

Reset local data:
```bash
rm server/data/corkboard.db
```
