# Project Card Tilt & Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give project pipeline cards a ±3° random tilt matching the corkboard vibe, and scale all card dimensions/typography up 25%.

**Architecture:** Two files change. `Projects.css` gets updated size values and new `transform` rules for tilt/hover/expanded states. `ProjectCard.tsx` imports the existing `getRotation` utility and passes `--pin-rotation` as an inline CSS custom property. No new utilities or components needed.

**Tech Stack:** React 18, plain CSS with CSS custom properties, existing `getRotation` hash utility in `pinUtils.ts`

---

## Files

- Modify: `client/src/components/Projects/Projects.css` — size scaling + tilt transform rules
- Modify: `client/src/components/Projects/ProjectCard.tsx` — import getRotation, pass --pin-rotation

---

### Task 1: Scale card dimensions in Projects.css

**Files:**
- Modify: `client/src/components/Projects/Projects.css`

- [ ] **Step 1: Update pipeline container and card grid**

In `Projects.css`, make the following changes:

```css
/* Line ~3: .project-pipeline */
.project-pipeline {
  padding: 0 16px 32px;
  max-width: 1400px;   /* was 1100px */
  margin: 0 auto;
}

/* Line ~66: .project-pipeline__cards */
.project-pipeline__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;           /* was 16px */
  align-items: flex-start;
}
```

- [ ] **Step 2: Update card width and inner padding**

```css
/* Line ~88: .project-card */
.project-card {
  position: relative;
  background: linear-gradient(145deg, #2a2215 0%, #1e1a0f 100%);
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-top: 4px solid #e8a838;
  border-radius: 12px;
  min-width: 544px;    /* was 435px */
  max-width: 638px;    /* was 510px */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: all 0.3s ease;
}

/* Line ~100: .project-card--expanded */
.project-card--expanded {
  max-width: 975px;    /* was 780px */
  width: 100%;
}

/* Line ~105: .project-card__inner */
.project-card__inner {
  padding: 25px 28px 18px;   /* was 20px 22px 14px */
}
```

- [ ] **Step 3: Update typography — emoji, name, percentage**

```css
/* Line ~124: .project-card__emoji */
.project-card__emoji {
  font-size: 35px;     /* was 28px */
  line-height: 1;
}

/* Line ~133: .project-card__name */
.project-card__name {
  margin: 0 0 2px;
  font-size: 24px;     /* was 19px */
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  color: #e8dcc8;
  font-weight: 700;
  line-height: 1.2;
}

/* Line ~149: .project-card__pct */
.project-card__pct {
  font-size: 30px;     /* was 24px */
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-weight: 800;
  line-height: 1;
}
```

- [ ] **Step 4: Update menu button size**

```css
/* Line ~160: .project-card__menu-btn */
.project-card__menu-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
  width: 35px;         /* was 28px */
  height: 35px;        /* was 28px */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;     /* was 16px */
  color: #c8b890;
  transition: all 0.15s;
  padding: 0;
}
```

- [ ] **Step 5: Update track chips and body padding**

```css
/* Line ~192: .project-card__track-chip */
.project-card__track-chip {
  font-size: 15px;     /* was 12px */
  padding: 5px 13px;   /* was 4px 10px */
  border-radius: 4px;
  background: rgba(232, 168, 56, 0.12);
  border: 1px solid rgba(232, 168, 56, 0.2);
  color: #c8a848;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
}

/* Line ~202: .project-card__body */
.project-card__body {
  padding: 0 18px 18px;   /* was 0 14px 14px */
}
```

- [ ] **Step 6: Update focus summary typography**

```css
/* Line ~220: .project-card__focus-label */
.project-card__focus-label {
  font-size: 11px;     /* was 9px */
  color: #a0906c;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 2px;
}

/* Line ~229: .project-card__focus-track */
.project-card__focus-track {
  font-size: 15px;     /* was 12px */
  color: #e8dcc8;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
}
```

- [ ] **Step 7: Update track card internals**

```css
/* Line ~284: .track-card */
.track-card {
  border-radius: 8px;
  padding: 13px 15px;     /* was 10px 12px */
  margin-bottom: 8px;
  background: rgba(0, 0, 0, 0.25);
  border-left: 3px solid #8899aa;
  transition: all 0.2s ease;
}

/* Line ~319: .track-card__name */
.track-card__name {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-size: 15px;     /* was 12px */
  font-weight: 600;
  color: #e8dcc8;
  letter-spacing: 0.02em;
}

/* Line ~327: .track-card__status-badge */
.track-card__status-badge {
  font-size: 11px;     /* was 9px */
  padding: 2px 6px;
  border-radius: 3px;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #1a1408;
}

/* Line ~361: .track-card__task */
.track-card__task {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
  font-size: 15px;     /* was 12px */
  color: #d4c8a8;
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  line-height: 1.4;
}
```

- [ ] **Step 8: Start dev server and verify sizing**

```bash
npm run dev -w client
```

Open http://localhost:5180, navigate to Projects view. Confirm cards are visibly larger. All text should feel proportionally bigger. No layout breakage.

- [ ] **Step 9: Commit sizing changes**

```bash
git add client/src/components/Projects/Projects.css
git commit -m "feat(projects): scale project cards 25% larger"
```

---

### Task 2: Add tilt CSS rules to Projects.css

**Files:**
- Modify: `client/src/components/Projects/Projects.css`

- [ ] **Step 1: Add transform to .project-card**

In `.project-card` (line ~88), add one line inside the existing rule:

```css
.project-card {
  position: relative;
  background: linear-gradient(145deg, #2a2215 0%, #1e1a0f 100%);
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-top: 4px solid #e8a838;
  border-radius: 12px;
  min-width: 544px;
  max-width: 638px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: all 0.3s ease;
  transform: rotate(var(--pin-rotation, 0deg));   /* ADD THIS LINE */
}
```

- [ ] **Step 2: Add hover lift rule**

Immediately after the `.project-card` rule block, add:

```css
.project-card:hover {
  transform: translateY(-3px) rotate(var(--pin-rotation, 0deg));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03);
}
```

- [ ] **Step 3: Reset tilt on expanded card**

In `.project-card--expanded` (line ~100), add the transform override:

```css
.project-card--expanded {
  max-width: 975px;
  width: 100%;
  transform: rotate(0deg);   /* ADD THIS LINE — snaps straight when expanded */
}
```

- [ ] **Step 4: Add expanded hover (no tilt)**

Immediately after `.project-card--expanded`, add:

```css
.project-card--expanded:hover {
  transform: translateY(-3px) rotate(0deg);
}
```

- [ ] **Step 5: Commit tilt CSS**

```bash
git add client/src/components/Projects/Projects.css
git commit -m "feat(projects): add CSS tilt rules for project cards"
```

---

### Task 3: Wire up getRotation in ProjectCard.tsx

**Files:**
- Modify: `client/src/components/Projects/ProjectCard.tsx`

- [ ] **Step 1: Import getRotation**

At the top of `ProjectCard.tsx`, after the existing imports (line ~8), add:

```tsx
import { getRotation } from '../../utils/pinUtils';
```

- [ ] **Step 2: Compute rotation from project ID**

Inside the `ProjectCard` function body, after the existing computed values (after the `claudeActive` line, ~line 46), add:

```tsx
const rotation = getRotation(project.id, 60);
```

- [ ] **Step 3: Pass --pin-rotation in the root div style**

The root `<div>` currently has (line ~66):

```tsx
<div
  className={`project-card ${isExpanded ? 'project-card--expanded' : ''}`}
  style={{ borderTopColor: project.color, borderColor: `${project.color}33` }}
>
```

Update it to include the rotation variable:

```tsx
<div
  className={`project-card ${isExpanded ? 'project-card--expanded' : ''}`}
  style={{
    borderTopColor: project.color,
    borderColor: `${project.color}33`,
    '--pin-rotation': `${rotation}deg`,
  } as React.CSSProperties}
>
```

- [ ] **Step 4: Verify in browser**

With dev server running (http://localhost:5180), navigate to Projects. Confirm:
- Each project card has a unique tilt angle
- No two cards tilt the same way
- Click to expand a card — it smoothly snaps to 0° (straight)
- Reload the page — each card's angle is identical to before reload (angles are deterministic, not random)

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Projects/ProjectCard.tsx
git commit -m "feat(projects): apply deterministic tilt to project cards"
```

---

### Task 4: Final check

- [ ] **Step 1: Run full build to catch any type errors**

```bash
npm run build
```

Expected: Build succeeds with no errors. TypeScript should be happy since `as React.CSSProperties` covers the CSS custom property.

- [ ] **Step 2: Visual smoke test**

With the dev server running:
1. Projects view — all cards tilted, larger, varied angles
2. Expand one card — snaps straight smoothly
3. Hover a card — lifts slightly, maintains tilt angle
4. Hover an expanded card — lifts slightly, stays straight
5. Check 2+ cards side by side — confirm angles differ

- [ ] **Step 3: Save plan to project docs**

```bash
cp /home/hank/.claude/plans/curious-foraging-reef.md docs/superpowers/plans/2026-04-02-project-card-tilt-sizing.md
git add docs/superpowers/plans/2026-04-02-project-card-tilt-sizing.md
git commit -m "docs(plans): add project card tilt and sizing implementation plan"
```
