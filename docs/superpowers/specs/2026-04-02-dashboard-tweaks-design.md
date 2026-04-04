# Dashboard Tweaks — Design Spec
**Date:** 2026-04-02  
**Scope:** Project pipeline cards only. Regular dashboard pin cards are not affected.

---

## 1. Card Title Font

**Change:** Replace `var(--font-display)` (Playfair Display / Georgia fallback) with `'IBM Plex Mono'` on `.project-card__name`.

**Rationale:** Playfair Display is not imported in `index.html`, causing a Georgia serif fallback that clashes with the rest of the UI. IBM Plex Mono is already loaded and used throughout the interface. Using it for titles creates a consistent monospace identity.

**Files:**
- `client/src/components/Projects/Projects.css` — update `font-family` on `.project-card__name`
- `client/src/App.css` — optionally update `--font-display` variable, or just override at the rule level

---

## 2. Project Card Size (~50% Larger)

**Change:** Scale up card dimensions, internal spacing, and font sizes. The layout system (flex-wrap) already handles variable card sizes gracefully, so no grid changes are needed.

**Target values:**

| Property | Current | New |
|---|---|---|
| `min-width` | 290px | 435px |
| `max-width` | 340px | 510px |
| `padding` (`.project-card__inner`) | 14px 16px 10px | 20px 22px 14px |
| `.project-card__name` font-size | 15px | 19px |
| `.project-card__meta` font-size | 10px | 11px |
| progress bar height | 4px | 6px |
| track chip font-size | 10px | 11px |
| track chip padding | 2px 6px | 3px 9px |
| footer font-size | 9px | 10px |
| emoji font-size | ~18px | ~24px |

**Constraint:** `Board.tsx` and all pin card components are untouched. The expanded card max-width (`520px`) should also scale — new value: `780px`.

---

## 3. Filter Label: "Claude" → "carl"

**Change:** In `ProjectPipeline.tsx`, update the display label for the `claude` filter value from `'🤖 Claude'` to `'🤖 carl'`.

**The underlying filter value `'claude'` and `FilterOwner` type are unchanged.** Only the rendered string changes.

**Rationale:** Personalizes the UI. The filtering logic itself is intentionally kept as-is: projects with `shared` tracks appear under both "Yours" and "carl" filters, which is correct behavior — shared projects belong to both parties.

---

## 4. Project Color on Cards

**Change:** Use each project's `color` field to drive:
1. The top border accent (`border-top: 4px solid <color>`)
2. The progress bar fill color

Currently both are hardcoded to `#e8a838` (amber). After this change, the amber value becomes the fallback only (for projects with no color set).

**Implementation:** The `color` field is already available on the `Project` type and passed into `ProjectCard` as a prop. Apply it via an inline `style` attribute on the border and bar fill elements.

**Files:**
- `client/src/components/Projects/ProjectCard.tsx` — add inline styles for border-top and bar fill using `project.color`
- `client/src/components/Projects/Projects.css` — remove hardcoded `#e8a838` from `.project-card` border-top and progress bar fill; set as fallback via CSS variable or keep as default that gets overridden

---

## Out of Scope

- Filtering logic behavior (intentionally unchanged)
- Regular dashboard pin cards (`Board.tsx`, individual Pin components)
- Hover state animations (not requested)
- Any server-side changes
