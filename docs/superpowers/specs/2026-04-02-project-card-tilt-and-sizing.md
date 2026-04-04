# Project Card Tilt & Sizing

**Date:** 2026-04-02  
**Status:** Approved

## Context

The corkboard pin cards (TaskPin, NotePin, etc.) have a subtle random tilt effect that gives the board a tactile, cork-board feel. Project cards in the pipeline view are currently flat and noticeably smaller than what feels comfortable at typical viewport sizes. This spec covers two visual improvements: matching the tilt feel of the pin cards, and bumping the card size up 25%.

## Changes

### 1. Random tilt on project cards

- Reuse `getRotation(id, range)` from `client/src/utils/pinUtils.ts` — the same utility used by all pin cards
- Call it with range `60` (same as NotePin), giving angles between **±3°**
- Each project's angle is **deterministic** — derived from its ID via hash, so it's consistent across reloads and users
- Apply via CSS custom property `--pin-rotation` on the `.project-card` root element (inline style, alongside existing `borderTopColor`/`borderColor`)
- Add `transform: rotate(var(--pin-rotation, 0deg))` to `.project-card` in CSS
- When a card is **expanded**, the existing `.project-card--expanded` CSS class overrides with `transform: rotate(0deg)` — the existing `transition: all 0.3s ease` on `.project-card` handles the smooth snap-to-straight animation automatically
- On hover, add a subtle lift: `transform: translateY(-3px) rotate(var(--pin-rotation, 0deg))`; expanded hover keeps `transform: translateY(-3px) rotate(0deg)`

### 2. Card size +25%

Scale the following values in `client/src/components/Projects/Projects.css`:

| Property | Before | After |
|---|---|---|
| `.project-card` min-width | 435px | 544px |
| `.project-card` max-width | 510px | 638px |
| `.project-card--expanded` max-width | 780px | 975px |
| `.project-pipeline` max-width | 1100px | 1400px |
| `.project-pipeline__cards` gap | 16px | 20px |
| `.project-card__inner` padding | 20px 22px 14px | 25px 28px 18px |
| `.project-card__emoji` font-size | 28px | 35px |
| `.project-card__name` font-size | 19px | 24px |
| `.project-card__pct` font-size | 24px | 30px |
| `.project-card__menu-btn` width/height | 28px | 35px |
| `.project-card__menu-btn` font-size | 16px | 20px |
| `.project-card__track-chip` font-size | 12px | 15px |
| `.project-card__track-chip` padding | 4px 10px | 5px 13px |
| `.project-card__body` padding | 0 14px 14px | 0 18px 18px |
| `.project-card__focus-label` font-size | 9px | 11px |
| `.project-card__focus-track` font-size | 12px | 15px |

Track card internals (inside expanded cards) also scale:

| Property | Before | After |
|---|---|---|
| `.track-card` padding | 10px 12px | 13px 15px |
| `.track-card__name` font-size | 12px | 15px |
| `.track-card__status-badge` font-size | 9px | 11px |
| `.track-card__task` font-size | 12px | 15px |

## Files to Modify

- `client/src/components/Projects/ProjectCard.tsx` — import `getRotation`, compute rotation from `project.id`, pass as `--pin-rotation` inline style (alongside existing `borderTopColor`/`borderColor`); clear rotation when expanded
- `client/src/components/Projects/Projects.css` — add `transform: rotate(var(--pin-rotation, 0deg))` and hover lift to `.project-card`; update all size values per table above

## What Is NOT Changing

- The rotation utility (`pinUtils.ts`) — no changes needed, just importing it
- The pipeline layout (flex-wrap) — cards will naturally reflow with the new sizes
- Expanded card interaction behavior — only the tilt resets, nothing else changes

## Verification

1. `npm run dev -w client` — open the Projects view
2. Confirm cards are visibly larger (~25%) and each has a unique tilt
3. Click to expand a card — confirm it snaps to straight (0°)
4. Reload — confirm each card's tilt angle is the same as before reload (deterministic)
5. Check multiple projects — confirm angles vary card to card
