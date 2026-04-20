# Deployment

Everything you need to run carl's corkie beyond `npm run dev`, or expose it safely beyond localhost.

## Configuration

Copy `.env.example` to `.env` and tweak as needed:

```bash
# Server port
PORT=3010
CORKBOARD_HOST=0.0.0.0

# CORS — add your LAN IP if you're accessing the Vite dev server from another device
CORS_ORIGINS=http://localhost:5180,http://127.0.0.1:5180

# Home Assistant lamp integration (optional — see ADVANCED.md)
# HA_URL=http://192.168.1.100:8123
# HA_TOKEN=your-long-lived-access-token
# HA_LIGHT_ENTITY=light.my_light

# Or use an external lamp server instead
# LAMP_SERVER=http://192.168.1.100:3011

# Client — leave empty for same-origin (recommended for most setups)
VITE_API_URL=
VITE_SOCKET_URL=
```

## Accessing from other devices on your LAN

The backend binds to `0.0.0.0` by default, so the production server (port `3010`) is reachable on both `localhost` and your machine's LAN IP with no extra setup — open `http://192.168.1.50:3010` from your phone/tablet and you're done.

The Vite **dev** server (port `5180`) is a separate story: it enforces CORS, so if you want to hit the dev server from another device, add your machine's LAN IP to `CORS_ORIGINS`:

```
CORS_ORIGINS=http://localhost:5180,http://192.168.1.50:5180
```

Then open `http://192.168.1.50:5180` from your phone/tablet. (If you only ever use `npm run pm2:start` / `npm run build`, you don't need to touch `CORS_ORIGINS`.)

## Running in production with PM2

```bash
npm run pm2:start    # Start both server and client
npm run pm2:stop     # Stop everything
npm run pm2:restart  # Restart
npm run pm2:logs     # Tail logs
```

PM2 config is in `ecosystem.config.cjs`.

## Authentication

Carl's Corkie is a single-user, self-hosted tool. It ships with a shared bearer token to keep random scanners and accidental port forwards from poking at your board, but it is **not** a multi-user permission system.

**On first run**, `npm run dev` (or `npm run build`, or `npm run pm2:start`) generates a random hex token and writes it into both `CORKBOARD_TOKEN` and `VITE_CORKBOARD_TOKEN` in `.env`. The server reads the first; the client bundle inlines the second at build time. They must match. `.env` is gitignored.

You should not need to do anything for the happy path — it just works.

### Sending requests as an external tool

The bundled `skill/scripts/corkboard.sh` reads `CORKBOARD_TOKEN` from your shell env or from `.env` in the current directory automatically. If you're hand-rolling curl, include the bearer header:

```bash
export CORKBOARD_API="http://localhost:3010"
export CORKBOARD_TOKEN="$(grep '^CORKBOARD_TOKEN=' .env | cut -d= -f2-)"

curl -X POST "$CORKBOARD_API/api/pins" \
  -H "Authorization: Bearer $CORKBOARD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"task","title":"Hello"}'
```

### Rotating the token

The token is stable by default. `scripts/ensure-token.mjs` only *generates* a token on first run when `.env` has none — it does not rotate existing tokens. The token changes only when you explicitly:

1. Run `npm run token:rotate`
2. Delete `.env` (or the token line) and restart, triggering fresh generation
3. Run a release-prep / secret-scrub workflow that clears secrets before publish

```bash
npm run token:rotate     # generate a new token in .env
npm run pm2:restart      # (or restart your dev server)
npm run build            # rebuild the client so the new token is baked in
```

> **Heads up for external integrations.** When the token rotates, anything hitting the API with a hardcoded token (n8n HTTP nodes, installed OpenClaw skills, Home Assistant automations, browser webhooks) will start returning 401 `Missing or invalid token`. Update those senders with the new value from `.env`. A running PM2 process may briefly keep serving with the *old* token cached in its process env until you restart it — so symptoms sometimes appear delayed, right after `pm2 restart`.

External senders need the new value too — re-source `.env` or update your shell env.

### Showing the current token

```bash
npm run token:show
```

### Disabling auth (only behind a reverse proxy)

If you already authenticate every request at a reverse proxy (Tailscale, Authelia, Cloudflare Access, nginx basic auth), corkie's built-in token becomes redundant — every caller has already proven who they are by the time the request arrives. In that setup the token just adds a second header to configure for every external integration without adding any real security. You can opt out of the built-in check by setting `CORKBOARD_AUTH=disabled` in `.env`. The server will print a loud warning on startup. **Do not do this if your dashboard is reachable from the internet without another auth layer in front of it.**

## Exposing only the API (advanced, reverse-proxy blueprint)

Some people want the dashboard to stay LAN-only but still let external services (webhooks, automation, remote scripts) post pins over the internet. This is not a built-in feature — corkie is a single process that serves both the API and the frontend — but any reverse proxy in front of corkie can enforce a path filter that blocks everything except `/api/*`. The frontend then becomes unreachable from the public hostname even though it's still running on the LAN.

A minimal nginx location block (works in Nginx Proxy Manager, Caddy, or raw nginx) looks like:

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

Point a public hostname (Cloudflare Tunnel, ngrok, Caddy + Let's Encrypt, your choice) at that reverse proxy. Anyone hitting `https://your-hostname/` gets a 404; only `/api/*` paths make it through, and they still have to pass the bearer-token check at corkie. Your LAN dashboard keeps working unchanged, and because corkie is still one process with one Socket.io instance, pins posted via the tunnel appear on the LAN dashboard in real-time.

This is a pattern, not a feature. We don't ship it, we don't support your particular reverse-proxy choice, and if you get this wrong you can expose the dashboard to the internet — so test from an external device (phone on cellular works) before trusting it. **You are responsible for your own perimeter.**

## Security model — the small print

- The token is baked into the client JS bundle and visible in browser DevTools. Anyone who can load the dashboard URL gets a copy of the token. This is expected: the token gates the API at the network layer, not per-user.
- For real "family member can view, only I can edit" semantics you need a real identity layer (cookies, OAuth, SSO). That's outside the scope of this repo.
- TLS is your responsibility. Run the dashboard behind a reverse proxy with HTTPS if it's reachable from anywhere you don't fully trust. The token rides in plain HTTP headers.