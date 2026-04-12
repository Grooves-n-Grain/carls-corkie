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

## Graphify

Use the `/graphify` skill to build a knowledge graph of this codebase for deep exploration or onboarding.

```
/graphify                              # Build graph on current directory
/graphify --mode deep                  # Richer semantic extraction
/graphify --update                     # Re-extract only changed files
/graphify query "<question>"           # BFS traversal of the graph
/graphify path "NodeA" "NodeB"         # Shortest path between concepts
/graphify explain "NodeName"           # Plain-language explanation of a node
```

Output lands in `graphify-out/` at the repo root. The persistent `graphify-out/graph.json` can be queried in future sessions without re-reading files.

<!-- autoskills:start -->

Summary generated by `autoskills`. Check the full files inside `.claude/skills`.

## Accessibility (a11y)

Audit and improve web accessibility following WCAG 2.2 guidelines. Use when asked to "improve accessibility", "a11y audit", "WCAG compliance", "screen reader support", "keyboard navigation", or "make accessible".

- `.claude/skills/accessibility/SKILL.md`
- `.claude/skills/accessibility/references/A11Y-PATTERNS.md`: Practical, copy-paste-ready patterns for common accessibility requirements. Each pattern is self-contained and linked from the main [SKILL.md](../SKILL.md).
- `.claude/skills/accessibility/references/WCAG.md`

## Design Thinking

Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beaut...

- `.claude/skills/frontend-design/SKILL.md`

## Node.js Backend Patterns

Build production-ready Node.js backend services with Express/Fastify, implementing middleware patterns, error handling, authentication, database integration, and API design best practices. Use when creating Node.js servers, REST APIs, GraphQL backends, or microservices architectures.

- `.claude/skills/nodejs-backend-patterns/SKILL.md`
- `.claude/skills/nodejs-backend-patterns/references/advanced-patterns.md`: Advanced patterns for dependency injection, database integration, authentication, caching, and API response formatting.

## Node.js Best Practices

Node.js development principles and decision-making. Framework selection, async patterns, security, and architecture. Teaches thinking, not copying.

- `.claude/skills/nodejs-best-practices/SKILL.md`

## Node.js Express Server

>

- `.claude/skills/nodejs-express-server/SKILL.md`
- `.claude/skills/nodejs-express-server/references/authentication-with-jwt.md`
- `.claude/skills/nodejs-express-server/references/basic-express-setup.md`
- `.claude/skills/nodejs-express-server/references/database-integration-postgresql-with-sequelize.md`
- `.claude/skills/nodejs-express-server/references/environment-configuration.md`
- `.claude/skills/nodejs-express-server/references/error-handling-middleware.md`
- `.claude/skills/nodejs-express-server/references/middleware-chain-implementation.md`
- `.claude/skills/nodejs-express-server/references/restful-routes-with-crud-operations.md`

## SEO optimization

Optimize for search engine visibility and ranking. Use when asked to "improve SEO", "optimize for search", "fix meta tags", "add structured data", "sitemap optimization", or "search engine optimization".

- `.claude/skills/seo/SKILL.md`

## TypeScript Advanced Types

Master TypeScript's advanced type system including generics, conditional types, mapped types, template literals, and utility types for building type-safe applications. Use when implementing complex type logic, creating reusable type utilities, or ensuring compile-time type safety in TypeScript pr...

- `.claude/skills/typescript-advanced-types/SKILL.md`

## React Composition Patterns

Composition patterns for building flexible, maintainable React components. Avoid boolean prop proliferation by using compound components, lifting state, and composing internals. These patterns make codebases easier for both humans and AI agents to work with as they scale.

- `.claude/skills/vercel-composition-patterns/SKILL.md`
- `.claude/skills/vercel-composition-patterns/AGENTS.md`: **Version 1.0.0** Engineering January 2026
- `.claude/skills/vercel-composition-patterns/README.md`: A structured repository for React composition patterns that scale. These patterns help avoid boolean prop proliferation by using compound components, lifting state, and composing internals.
- `.claude/skills/vercel-composition-patterns/rules/_sections.md`: This file defines all sections, their ordering, impact levels, and descriptions. The section ID (in parentheses) is the filename prefix used to group rules.
- `.claude/skills/vercel-composition-patterns/rules/_template.md`: Brief explanation of the rule and why it matters.
- `.claude/skills/vercel-composition-patterns/rules/architecture-avoid-boolean-props.md`: Don't add boolean props like `isThread`, `isEditing`, `isDMThread` to customize component behavior. Each boolean doubles possible states and creates unmaintainable conditional logic. Use composition instead.
- `.claude/skills/vercel-composition-patterns/rules/architecture-compound-components.md`: Structure complex components as compound components with a shared context. Each subcomponent accesses shared state via context, not props. Consumers compose the pieces they need.
- `.claude/skills/vercel-composition-patterns/rules/patterns-children-over-render-props.md`: Use `children` for composition instead of `renderX` props. Children are more readable, compose naturally, and don't require understanding callback signatures.
- `.claude/skills/vercel-composition-patterns/rules/patterns-explicit-variants.md`: Instead of one component with many boolean props, create explicit variant components. Each variant composes the pieces it needs. The code documents itself.
- `.claude/skills/vercel-composition-patterns/rules/react19-no-forwardref.md`: In React 19, `ref` is now a regular prop (no `forwardRef` wrapper needed), and `use()` replaces `useContext()`.
- `.claude/skills/vercel-composition-patterns/rules/state-context-interface.md`: Define a **generic interface** for your component context with three parts: can implement—enabling the same UI components to work with completely different state implementations.
- `.claude/skills/vercel-composition-patterns/rules/state-decouple-implementation.md`: The provider component should be the only place that knows how state is managed. UI components consume the context interface—they don't know if state comes from useState, Zustand, or a server sync.
- `.claude/skills/vercel-composition-patterns/rules/state-lift-state.md`: Move state management into dedicated provider components. This allows sibling components outside the main UI to access and modify state without prop drilling or awkward refs.

## Vercel React Best Practices

React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimizati...

- `.claude/skills/vercel-react-best-practices/SKILL.md`
- `.claude/skills/vercel-react-best-practices/AGENTS.md`: **Version 1.0.0** Vercel Engineering January 2026
- `.claude/skills/vercel-react-best-practices/README.md`: A structured repository for creating and maintaining React Best Practices optimized for agents and LLMs.
- `.claude/skills/vercel-react-best-practices/rules/_sections.md`: This file defines all sections, their ordering, impact levels, and descriptions. The section ID (in parentheses) is the filename prefix used to group rules.
- `.claude/skills/vercel-react-best-practices/rules/_template.md`: **Impact: MEDIUM (optional impact description)**
- `.claude/skills/vercel-react-best-practices/rules/advanced-effect-event-deps.md`: Effect Event functions do not have a stable identity. Their identity intentionally changes on every render. Do not include the function returned by `useEffectEvent` in a `useEffect` dependency array. Keep the actual reactive values as dependencies and call the Effect Event from inside the effect...
- `.claude/skills/vercel-react-best-practices/rules/advanced-event-handler-refs.md`: Store callbacks in refs when used in effects that shouldn't re-subscribe on callback changes.
- `.claude/skills/vercel-react-best-practices/rules/advanced-init-once.md`: Do not put app-wide initialization that must run once per app load inside `useEffect([])` of a component. Components can remount and effects will re-run. Use a module-level guard or top-level init in the entry module instead.
- `.claude/skills/vercel-react-best-practices/rules/advanced-use-latest.md`: Access latest values in callbacks without adding them to dependency arrays. Prevents effect re-runs while avoiding stale closures.
- `.claude/skills/vercel-react-best-practices/rules/async-api-routes.md`: In API routes and Server Actions, start independent operations immediately, even if you don't await them yet.
- `.claude/skills/vercel-react-best-practices/rules/async-cheap-condition-before-await.md`: When a branch uses `await` for a flag or remote value and also requires a **cheap synchronous** condition (local props, request metadata, already-loaded state), evaluate the cheap condition **first**. Otherwise you pay for the async call even when the compound condition can never be true.
- `.claude/skills/vercel-react-best-practices/rules/async-defer-await.md`: Move `await` operations into the branches where they're actually used to avoid blocking code paths that don't need them.
- `.claude/skills/vercel-react-best-practices/rules/async-dependencies.md`: For operations with partial dependencies, use `better-all` to maximize parallelism. It automatically starts each task at the earliest possible moment.
- `.claude/skills/vercel-react-best-practices/rules/async-parallel.md`: When async operations have no interdependencies, execute them concurrently using `Promise.all()`.
- `.claude/skills/vercel-react-best-practices/rules/async-suspense-boundaries.md`: Instead of awaiting data in async components before returning JSX, use Suspense boundaries to show the wrapper UI faster while data loads.
- `.claude/skills/vercel-react-best-practices/rules/bundle-barrel-imports.md`: Import directly from source files instead of barrel files to avoid loading thousands of unused modules. **Barrel files** are entry points that re-export multiple modules (e.g., `index.js` that does `export * from './module'`).
- `.claude/skills/vercel-react-best-practices/rules/bundle-conditional.md`: Load large data or modules only when a feature is activated.
- `.claude/skills/vercel-react-best-practices/rules/bundle-defer-third-party.md`: Analytics, logging, and error tracking don't block user interaction. Load them after hydration.
- `.claude/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md`: Use `next/dynamic` to lazy-load large components not needed on initial render.
- `.claude/skills/vercel-react-best-practices/rules/bundle-preload.md`: Preload heavy bundles before they're needed to reduce perceived latency.
- `.claude/skills/vercel-react-best-practices/rules/client-event-listeners.md`: Use `useSWRSubscription()` to share global event listeners across component instances.
- `.claude/skills/vercel-react-best-practices/rules/client-localstorage-schema.md`: Add version prefix to keys and store only needed fields. Prevents schema conflicts and accidental storage of sensitive data.
- `.claude/skills/vercel-react-best-practices/rules/client-passive-event-listeners.md`: Add `{ passive: true }` to touch and wheel event listeners to enable immediate scrolling. Browsers normally wait for listeners to finish to check if `preventDefault()` is called, causing scroll delay.
- `.claude/skills/vercel-react-best-practices/rules/client-swr-dedup.md`: SWR enables request deduplication, caching, and revalidation across component instances.
- `.claude/skills/vercel-react-best-practices/rules/js-batch-dom-css.md`: Avoid interleaving style writes with layout reads. When you read a layout property (like `offsetWidth`, `getBoundingClientRect()`, or `getComputedStyle()`) between style changes, the browser is forced to trigger a synchronous reflow.
- `.claude/skills/vercel-react-best-practices/rules/js-cache-function-results.md`: Use a module-level Map to cache function results when the same function is called repeatedly with the same inputs during render.
- `.claude/skills/vercel-react-best-practices/rules/js-cache-property-access.md`: Cache object property lookups in hot paths.
- `.claude/skills/vercel-react-best-practices/rules/js-cache-storage.md`: **Incorrect (reads storage on every call):**
- `.claude/skills/vercel-react-best-practices/rules/js-combine-iterations.md`: Multiple `.filter()` or `.map()` calls iterate the array multiple times. Combine into one loop.
- `.claude/skills/vercel-react-best-practices/rules/js-early-exit.md`: Return early when result is determined to skip unnecessary processing.
- `.claude/skills/vercel-react-best-practices/rules/js-flatmap-filter.md`: **Impact: LOW-MEDIUM (eliminates intermediate array)**
- `.claude/skills/vercel-react-best-practices/rules/js-hoist-regexp.md`: Don't create RegExp inside render. Hoist to module scope or memoize with `useMemo()`.
- `.claude/skills/vercel-react-best-practices/rules/js-index-maps.md`: Multiple `.find()` calls by the same key should use a Map.
- `.claude/skills/vercel-react-best-practices/rules/js-length-check-first.md`: When comparing arrays with expensive operations (sorting, deep equality, serialization), check lengths first. If lengths differ, the arrays cannot be equal.
- `.claude/skills/vercel-react-best-practices/rules/js-min-max-loop.md`: Finding the smallest or largest element only requires a single pass through the array. Sorting is wasteful and slower.
- `.claude/skills/vercel-react-best-practices/rules/js-request-idle-callback.md`: **Impact: MEDIUM (keeps UI responsive during background tasks)**
- `.claude/skills/vercel-react-best-practices/rules/js-set-map-lookups.md`: Convert arrays to Set/Map for repeated membership checks.
- `.claude/skills/vercel-react-best-practices/rules/js-tosorted-immutable.md`: **Incorrect (mutates original array):**
- `.claude/skills/vercel-react-best-practices/rules/rendering-activity.md`: Use React's `<Activity>` to preserve state/DOM for expensive components that frequently toggle visibility.
- `.claude/skills/vercel-react-best-practices/rules/rendering-animate-svg-wrapper.md`: Many browsers don't have hardware acceleration for CSS3 animations on SVG elements. Wrap SVG in a `<div>` and animate the wrapper instead.
- `.claude/skills/vercel-react-best-practices/rules/rendering-conditional-render.md`: Use explicit ternary operators (`? :`) instead of `&&` for conditional rendering when the condition can be `0`, `NaN`, or other falsy values that render.
- `.claude/skills/vercel-react-best-practices/rules/rendering-content-visibility.md`: Apply `content-visibility: auto` to defer off-screen rendering.
- `.claude/skills/vercel-react-best-practices/rules/rendering-hoist-jsx.md`: Extract static JSX outside components to avoid re-creation.
- `.claude/skills/vercel-react-best-practices/rules/rendering-hydration-no-flicker.md`: When rendering content that depends on client-side storage (localStorage, cookies), avoid both SSR breakage and post-hydration flickering by injecting a synchronous script that updates the DOM before React hydrates.
- `.claude/skills/vercel-react-best-practices/rules/rendering-hydration-suppress-warning.md`: In SSR frameworks (e.g., Next.js), some values are intentionally different on server vs client (random IDs, dates, locale/timezone formatting). For these *expected* mismatches, wrap the dynamic text in an element with `suppressHydrationWarning` to prevent noisy warnings. Do not use this to hide r...
- `.claude/skills/vercel-react-best-practices/rules/rendering-resource-hints.md`: **Impact: HIGH (reduces load time for critical resources)**
- `.claude/skills/vercel-react-best-practices/rules/rendering-script-defer-async.md`: **Impact: HIGH (eliminates render-blocking)**
- `.claude/skills/vercel-react-best-practices/rules/rendering-svg-precision.md`: Reduce SVG coordinate precision to decrease file size. The optimal precision depends on the viewBox size, but in general reducing precision should be considered.
- `.claude/skills/vercel-react-best-practices/rules/rendering-usetransition-loading.md`: Use `useTransition` instead of manual `useState` for loading states. This provides built-in `isPending` state and automatically manages transitions.
- `.claude/skills/vercel-react-best-practices/rules/rerender-defer-reads.md`: Don't subscribe to dynamic state (searchParams, localStorage) if you only read it inside callbacks.
- `.claude/skills/vercel-react-best-practices/rules/rerender-dependencies.md`: Specify primitive dependencies instead of objects to minimize effect re-runs.
- `.claude/skills/vercel-react-best-practices/rules/rerender-derived-state-no-effect.md`: If a value can be computed from current props/state, do not store it in state or update it in an effect. Derive it during render to avoid extra renders and state drift. Do not set state in effects solely in response to prop changes; prefer derived values or keyed resets instead.
- `.claude/skills/vercel-react-best-practices/rules/rerender-derived-state.md`: Subscribe to derived boolean state instead of continuous values to reduce re-render frequency.
- `.claude/skills/vercel-react-best-practices/rules/rerender-functional-setstate.md`: When updating state based on the current state value, use the functional update form of setState instead of directly referencing the state variable. This prevents stale closures, eliminates unnecessary dependencies, and creates stable callback references.
- `.claude/skills/vercel-react-best-practices/rules/rerender-lazy-state-init.md`: Pass a function to `useState` for expensive initial values. Without the function form, the initializer runs on every render even though the value is only used once.
- `.claude/skills/vercel-react-best-practices/rules/rerender-memo-with-default-value.md`: When memoized component has a default value for some non-primitive optional parameter, such as an array, function, or object, calling the component without that parameter results in broken memoization. This is because new value instances are created on every rerender, and they do not pass strict...
- `.claude/skills/vercel-react-best-practices/rules/rerender-memo.md`: Extract expensive work into memoized components to enable early returns before computation.
- `.claude/skills/vercel-react-best-practices/rules/rerender-move-effect-to-event.md`: If a side effect is triggered by a specific user action (submit, click, drag), run it in that event handler. Do not model the action as state + effect; it makes effects re-run on unrelated changes and can duplicate the action.
- `.claude/skills/vercel-react-best-practices/rules/rerender-no-inline-components.md`: **Impact: HIGH (prevents remount on every render)**
- `.claude/skills/vercel-react-best-practices/rules/rerender-simple-expression-in-memo.md`: When an expression is simple (few logical or arithmetical operators) and has a primitive result type (boolean, number, string), do not wrap it in `useMemo`. Calling `useMemo` and comparing hook dependencies may consume more resources than the expression itself.
- `.claude/skills/vercel-react-best-practices/rules/rerender-split-combined-hooks.md`: When a hook contains multiple independent tasks with different dependencies, split them into separate hooks. A combined hook reruns all tasks when any dependency changes, even if some tasks don't use the changed value.
- `.claude/skills/vercel-react-best-practices/rules/rerender-transitions.md`: Mark frequent, non-urgent state updates as transitions to maintain UI responsiveness.
- `.claude/skills/vercel-react-best-practices/rules/rerender-use-deferred-value.md`: When user input triggers expensive computations or renders, use `useDeferredValue` to keep the input responsive. The deferred value lags behind, allowing React to prioritize the input update and render the expensive result when idle.
- `.claude/skills/vercel-react-best-practices/rules/rerender-use-ref-transient-values.md`: When a value changes frequently and you don't want a re-render on every update (e.g., mouse trackers, intervals, transient flags), store it in `useRef` instead of `useState`. Keep component state for UI; use refs for temporary DOM-adjacent values. Updating a ref does not trigger a re-render.
- `.claude/skills/vercel-react-best-practices/rules/server-after-nonblocking.md`: Use Next.js's `after()` to schedule work that should execute after a response is sent. This prevents logging, analytics, and other side effects from blocking the response.
- `.claude/skills/vercel-react-best-practices/rules/server-auth-actions.md`: **Impact: CRITICAL (prevents unauthorized access to server mutations)**
- `.claude/skills/vercel-react-best-practices/rules/server-cache-lru.md`: **Implementation:**
- `.claude/skills/vercel-react-best-practices/rules/server-cache-react.md`: Use `React.cache()` for server-side request deduplication. Authentication and database queries benefit most.
- `.claude/skills/vercel-react-best-practices/rules/server-dedup-props.md`: **Impact: LOW (reduces network payload by avoiding duplicate serialization)**
- `.claude/skills/vercel-react-best-practices/rules/server-hoist-static-io.md`: **Impact: HIGH (avoids repeated file/network I/O per request)**
- `.claude/skills/vercel-react-best-practices/rules/server-no-shared-module-state.md`: For React Server Components and client components rendered during SSR, avoid using mutable module-level variables to share request-scoped data. Server renders can run concurrently in the same process. If one render writes to shared module state and another render reads it, you can get race condit...
- `.claude/skills/vercel-react-best-practices/rules/server-parallel-fetching.md`: React Server Components execute sequentially within a tree. Restructure with composition to parallelize data fetching.
- `.claude/skills/vercel-react-best-practices/rules/server-parallel-nested-fetching.md`: When fetching nested data in parallel, chain dependent fetches within each item's promise so a slow item doesn't block the rest.
- `.claude/skills/vercel-react-best-practices/rules/server-serialization.md`: The React Server/Client boundary serializes all object properties into strings and embeds them in the HTML response and subsequent RSC requests. This serialized data directly impacts page weight and load time, so **size matters a lot**. Only pass fields that the client actually uses.

## Vite

Vite build tool configuration, plugin API, SSR, and Vite 8 Rolldown migration. Use when working with Vite projects, vite.config.ts, Vite plugins, or building libraries/SSR apps with Vite.

- `.claude/skills/vite/SKILL.md`
- `.claude/skills/vite/GENERATION.md`
- `.claude/skills/vite/references/build-and-ssr.md`: Vite library mode, multi-page apps, JavaScript API, and SSR guidance
- `.claude/skills/vite/references/core-config.md`: Vite configuration patterns using vite.config.ts
- `.claude/skills/vite/references/core-features.md`: Vite-specific import patterns and runtime features
- `.claude/skills/vite/references/core-plugin-api.md`: Vite plugin authoring with Vite-specific hooks
- `.claude/skills/vite/references/environment-api.md`: Vite 6+ Environment API for multiple runtime environments
- `.claude/skills/vite/references/rolldown-migration.md`: Vite 8 Rolldown bundler and Oxc transformer migration

## Core

Vitest fast unit testing framework powered by Vite with Jest-compatible API. Use when writing tests, mocking, configuring coverage, or working with test filtering and fixtures.

- `.claude/skills/vitest/SKILL.md`
- `.claude/skills/vitest/GENERATION.md`
- `.claude/skills/vitest/references/advanced-environments.md`: Configure environments like jsdom, happy-dom for browser APIs
- `.claude/skills/vitest/references/advanced-projects.md`: Multi-project configuration for monorepos and different test types
- `.claude/skills/vitest/references/advanced-type-testing.md`: Test TypeScript types with expectTypeOf and assertType
- `.claude/skills/vitest/references/advanced-vi.md`: vi helper for mocking, timers, utilities
- `.claude/skills/vitest/references/core-cli.md`: Command line interface commands and options
- `.claude/skills/vitest/references/core-config.md`: Configure Vitest with vite.config.ts or vitest.config.ts
- `.claude/skills/vitest/references/core-describe.md`: describe/suite for grouping tests into logical blocks
- `.claude/skills/vitest/references/core-expect.md`: Assertions with matchers, asymmetric matchers, and custom matchers
- `.claude/skills/vitest/references/core-hooks.md`: beforeEach, afterEach, beforeAll, afterAll, and around hooks
- `.claude/skills/vitest/references/core-test-api.md`: test/it function for defining tests with modifiers
- `.claude/skills/vitest/references/features-concurrency.md`: Concurrent tests, parallel execution, and sharding
- `.claude/skills/vitest/references/features-context.md`: Test context, custom fixtures with test.extend
- `.claude/skills/vitest/references/features-coverage.md`: Code coverage with V8 or Istanbul providers
- `.claude/skills/vitest/references/features-filtering.md`: Filter tests by name, file patterns, and tags
- `.claude/skills/vitest/references/features-mocking.md`: Mock functions, modules, timers, and dates with vi utilities
- `.claude/skills/vitest/references/features-snapshots.md`: Snapshot testing with file, inline, and file snapshots

<!-- autoskills:end -->
