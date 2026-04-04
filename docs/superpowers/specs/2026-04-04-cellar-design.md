# The Cellar — Design Spec

**Date:** 2026-04-04
**Status:** Approved

---

## Problem

Carl's Corkie project board is for active work. But ideas arrive constantly and need somewhere to live that isn't the active board (which should stay focused) and isn't "archived" (finished) or "on hold" (paused, waiting on something). There was no "someday" queue.

## Solution: The Cellar

A fourth project status — `cellar` — and a dedicated full-page view accessed via a cellar door button on the project board. Named after the wine-cellar/cork theme of the app: the cellar is where you store the good stuff until it's ready.

**Status meanings:**
- `active` — on the board, being worked on now
- `on-hold` — paused, waiting on something
- `archived` — finished / completed
- `cellar` *(new)* — future idea, not started, saved for later

---

## UX Flow

1. A **cellar door button** sits in the project board toolbar
2. Clicking it **slides the board left** and reveals the Cellar as a full-width view — feels like descending into a different space
3. Inside the Cellar: a card grid of future ideas with a **"+ New Idea"** button
4. Clicking a card opens the full `ProjectDetailModal` — same editing experience as the active board
5. Each card has a **"Bring to Board"** action (via menu) that moves it to `active`
6. A **back button** slides back to the board
7. From the active board, any project's menu gets a **"Send to Cellar"** option

---

## Architecture

Follows the same 5-layer pattern used by `on-hold` and `archived`:

| Layer | Change |
|-------|--------|
| `shared/types.ts` | Add `'cellar'` to `ProjectStatus` union |
| `server/src/db.ts` | Migrate `CHECK` constraint via rename→recreate→copy→drop (same as `migrateLegacyPinTypeConstraint`) |
| `server/src/projects.ts` | Add `cellarProject(id)` function |
| `server/src/app.ts` | Add `POST /api/projects/:id/cellar` endpoint |
| `client/src/hooks/useProjects.ts` | Add `cellarProjects`, `cellarProject`, `createCellarProject` |

### Slide Animation
CSS-only using `translateX`. A `pipeline-stage` flex container is `width: 200%`. Each panel (board, cellar) is `50%` of that (= 100vw). Toggling `.pipeline-stage--cellar` sets `transform: translateX(-50%)` with a `0.4s` cubic-bezier transition. The outer container has `overflow: hidden`.

### New Components
- **`CellarView.tsx`** — full-page cellar container (toolbar, card grid, empty state, modals)
- **`CellarCard.tsx`** — individual cellar card; visually muted vs active cards, primary action is open detail, menu has "Bring to Board" / "Archive" / "Delete"

### Reused Components
- `ProjectDetailModal` — works unchanged; shows correct menu options because `ProjectMenu` is status-driven
- `NewProjectModal` — used via `createCellarProject` which creates then immediately cellars the project
- `DeleteModal`, `HoldModal` — unchanged, passed through

---

## Key Decisions

**Why not reuse `archived` for this?** Archived = finished. Cellar = not yet started. Semantically distinct, and users would lose the ability to distinguish completed work from future ideas.

**Why `resumeProject` as "Bring to Board"?** It already sets `project_status: 'active'` and clears `hold_reason`. Reusing it avoids a new server function for semantically identical behavior.

**Why a full slide vs a drawer/modal?** The Cellar is a workspace, not a list. You go there to build out ideas. A full-page transition reinforces that you've "entered" a different space — consistent with the cellar door metaphor.

**Why `createCellarProject` in the hook?** Creating via `NewProjectModal` always produces an `active` project. Rather than adding complexity to the modal, the hook chains `createProject → cellarProject` atomically from the Cellar's perspective.

---

## Files

### Create
- `client/src/components/Projects/CellarView.tsx`
- `client/src/components/Projects/CellarCard.tsx`

### Modify
- `shared/types.ts`
- `server/src/db.ts`
- `server/src/projects.ts`
- `server/src/app.ts`
- `client/src/hooks/useProjects.ts`
- `client/src/components/Projects/ProjectMenu.tsx`
- `client/src/components/Projects/ProjectPipeline.tsx`
- `client/src/components/Projects/Projects.css`
- `client/src/components/Projects/MobileProjectView.tsx`
- `client/src/components/Projects/ProjectCard.tsx` (MenuAction type)
- `client/src/components/Projects/ProjectDetailModal.tsx` (MenuAction type)
- `client/src/components/Projects/ProjectDetailView.tsx` (MenuAction type)
- `client/src/components/Projects/ShelfDrawer.tsx` (MenuAction type)

---

## Verification

1. Create project → menu → "Send to Cellar" → leaves board
2. Cellar door button → board slides left, Cellar appears
3. Click cellar card → full detail modal opens with editing
4. "+ New Idea" → project goes directly to cellar, never hits active board
5. "Bring to Board" → project moves to active; visible on board after slide back
6. Restart server → DB migration ran, `project_status` constraint includes `'cellar'`
7. Mobile: cellar projects absent from active section
