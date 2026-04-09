# YouTube Card for corkie Implementation Plan

> **For Claude:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a first-class `youtube` pin type to corkie that ingests a YouTube video URL, extracts metadata, renders a YouTube-themed card with mandatory thumbnail, and opens an inline modal player with fallback to YouTube.

**Architecture:** Extend the existing pin schema and API to support a structured `youtubeData` payload, add a helper ingestion path that normalizes URLs and extracts metadata via `yt-dlp` with oEmbed fallback, and implement a dedicated frontend renderer plus modal player. Keep v1 scoped to single-video URLs only; playlists/channels/transcripts stay out of scope.

**Tech Stack:** Existing corkie stack (Vite/React frontend inferred from bundle, REST + Socket.IO backend inferred from API docs), `yt-dlp` for metadata extraction, existing `/api/pins` create/update flow, existing custom pin rendering patterns (`twitter`, `reddit`, `article`).

---

## Assumptions To Verify Before Coding

These are strongly suggested by the live app and skill docs, but the implementer should confirm exact filenames in the repo before editing.

- Frontend is a Vite/React app with custom pin renderers and CSS modules or shared styles.
- Backend already validates specialized pin payloads and persists arbitrary typed pin metadata.
- There is an existing helper script at `skill/scripts/corkboard.sh` or equivalent with commands like `add-twitter`, `add-reddit`, and `add-article`.
- Backend API is the same one documented in `references/api.md` and currently powering `http://10.10.10.158:3010`.

If actual file names differ, preserve the intent of each task and swap in the real paths.

---

## Feature Contract

### Supported URLs
- `https://www.youtube.com/watch?v=<id>`
- `https://youtu.be/<id>`
- `https://www.youtube.com/shorts/<id>`
- `https://www.youtube.com/live/<id>`

### v1 Behavior
1. User provides a YouTube URL.
2. System normalizes it to a canonical watch URL.
3. System extracts metadata using `yt-dlp`, with oEmbed fallback if `yt-dlp` is unavailable or fails.
4. System creates a pin of type `youtube` with `youtubeData` payload.
5. Board shows a YouTube-themed card with thumbnail, title, channel, date, description snippet, and optional duration badge.
6. Clicking the card opens a modal.
7. Modal tries to embed and play the video inline.
8. If embed fails or is blocked, modal still shows metadata and an `Open on YouTube` button.

### Non-Goals For v1
- playlists
- channel cards
- transcripts
- comments
- likes/view counts
- watch progress
- downloads
- summarization

---

## Proposed Data Model

```ts
type PinType =
  | 'task'
  | 'note'
  | 'link'
  | 'event'
  | 'alert'
  | 'email'
  | 'opportunity'
  | 'briefing'
  | 'github'
  | 'idea'
  | 'tracking'
  | 'article'
  | 'twitter'
  | 'reddit'
  | 'youtube';

interface YouTubeData {
  videoId: string;
  channelTitle?: string;
  description?: string;
  thumbnailUrl: string;
  publishedAt?: string;
  duration?: string;
  embedUrl?: string;
  sourceUrl?: string;
}
```

Validation rules:
- `type === 'youtube'`
- `title` required
- `url` required and absolute `http(s)`
- `youtubeData.videoId` required
- `youtubeData.thumbnailUrl` required and absolute `http(s)`
- `youtubeData.embedUrl` optional but if present must be absolute `http(s)`

---

## Implementation Order

1. Find the actual backend pin schema and validator.
2. Add failing backend tests for `youtube` payload acceptance/rejection.
3. Implement schema + persistence support.
4. Add metadata extraction utility with tests.
5. Add helper command / ingestion path.
6. Add frontend `YouTubePin` renderer.
7. Add modal player behavior and fallback.
8. Add end-to-end QA and docs.

---

## Backend Workstream

### Task B1: Locate pin model, validation, and create/update routes

**Objective:** Identify the exact files and types that define pins, validation, and the `/api/pins` create/update flow.

**Files:**
- Inspect likely backend paths such as:
  - `server/src/routes/pins.*`
  - `server/src/lib/validation.*`
  - `server/src/types/pins.*`
  - `server/src/db/*`
  - `server/src/socket/*`
- Inspect frontend types too if shared:
  - `src/types/pins.*`

**Step 1: Find candidate files**

Run something like:
```bash
rg -n "articleData|trackingStatus|type:\s*'twitter'|type:\s*'reddit'|/api/pins|PinType" .
```

**Step 2: Write down exact file paths actually used**

Create a short scratch note with the real paths found.

**Step 3: Confirm how specialized fields are validated**

Read the file that currently validates `articleData`, `trackingStatus`, or `emailFrom`.

**Step 4: Confirm how pin payloads are stored**

Verify whether the backend stores structured JSON, nullable columns, or raw blobs.

**Step 5: Commit notes only if you maintain planning docs in repo**

No code commit required yet.

---

### Task B2: Add failing backend tests for `youtube` payload validation

**Objective:** Lock in what a valid `youtube` pin looks like before touching implementation.

**Files:**
- Modify: real backend route/validation test file, likely something like `server/test/pins.test.ts`
- If no tests exist, create: `server/test/youtube-pin-validation.test.ts`

**Step 1: Write failing test for valid youtube pin creation**

Example test shape:
```ts
it('accepts a valid youtube pin payload', async () => {
  const payload = {
    type: 'youtube',
    title: 'Demo video',
    url: 'https://www.youtube.com/watch?v=abc123xyz00',
    youtubeData: {
      videoId: 'abc123xyz00',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc123xyz00/hqdefault.jpg',
      channelTitle: 'Demo Channel',
      description: 'A demo description',
      publishedAt: '2026-04-09T12:00:00Z',
      duration: '12:44',
      embedUrl: 'https://www.youtube.com/embed/abc123xyz00',
      sourceUrl: 'https://www.youtube.com/watch?v=abc123xyz00'
    }
  };

  const res = await request(app).post('/api/pins').send(payload);
  expect(res.status).toBe(201);
  expect(res.body.type).toBe('youtube');
  expect(res.body.youtubeData.videoId).toBe('abc123xyz00');
});
```

**Step 2: Write failing tests for invalid payloads**

Cases:
- missing `youtubeData`
- missing `videoId`
- missing `thumbnailUrl`
- bad `thumbnailUrl`
- bad `embedUrl`

**Step 3: Run only these tests**

Example:
```bash
npm test -- youtube-pin-validation
```

Expected: FAIL because `youtube` type is not accepted yet.

**Step 4: Commit test scaffold**

```bash
git add <test files>
git commit -m "test: define youtube pin validation contract"
```

---

### Task B3: Extend pin type definitions and validation schema

**Objective:** Teach the backend that `youtube` is a first-class pin type.

**Files:**
- Modify: actual shared/backend pin type file
- Modify: validation schema file for pin payloads

**Step 1: Add `youtube` to pin type union/enum**

**Step 2: Define `YouTubeData` type/interface**

**Step 3: Extend create/update validation schema**

Validation expectations:
- `title` required
- `url` required
- `youtubeData.videoId` required
- `youtubeData.thumbnailUrl` required
- optional metadata allowed

**Step 4: Re-run validation tests**

Expected: valid/invalid tests should now pass if persistence already supports structured JSON.

**Step 5: Commit**

```bash
git add <types file> <validation file>
git commit -m "feat: add youtube pin schema"
```

---

### Task B4: Ensure persistence and API serialization include `youtubeData`

**Objective:** Make sure `youtubeData` survives create/read/update without being dropped.

**Files:**
- Modify: real database persistence file(s)
- Modify: serializer/mapper files if present
- Test: existing route/integration tests

**Step 1: Inspect current handling for `articleData`**

Use `articleData` as the implementation pattern.

**Step 2: Mirror that pattern for `youtubeData`**

If metadata is stored as JSON, include `youtubeData` in the same flow.

**Step 3: Add failing integration test if needed**

Create a pin, fetch all pins, assert `youtubeData` is still present.

**Step 4: Run route tests**

Expected: youtube pins round-trip correctly.

**Step 5: Commit**

```bash
git add <persistence files> <tests>
git commit -m "feat: persist youtube pin metadata"
```

---

### Task B5: Add YouTube URL normalization utility

**Objective:** Normalize supported YouTube URLs into a canonical watch URL and extract `videoId`.

**Files:**
- Create: backend/shared utility file, e.g. `server/src/lib/youtube.ts`
- Test: `server/test/youtube-url.test.ts`

**Step 1: Write failing tests**

Cases:
- watch URL → same video ID
- youtu.be URL → normalized watch URL
- shorts URL → normalized watch URL
- live URL → normalized watch URL
- unsupported URL → explicit error

Example assertions:
```ts
expect(parseYouTubeUrl('https://youtu.be/abc123xyz00')).toEqual({
  videoId: 'abc123xyz00',
  sourceUrl: 'https://www.youtube.com/watch?v=abc123xyz00',
  embedUrl: 'https://www.youtube.com/embed/abc123xyz00'
});
```

**Step 2: Run tests to verify failure**

**Step 3: Implement minimal parser**

**Step 4: Run tests to verify pass**

**Step 5: Commit**

```bash
git add <youtube util> <tests>
git commit -m "feat: add youtube url normalization"
```

---

### Task B6: Add metadata extraction service with `yt-dlp` primary and oEmbed fallback

**Objective:** Provide one internal function that turns a YouTube URL into normalized metadata.

**Files:**
- Create: utility/service, e.g. `server/src/lib/youtube-metadata.ts`
- Test: `server/test/youtube-metadata.test.ts`

**Step 1: Write unit tests against mocked subprocess/network behavior**

Test cases:
- `yt-dlp` success returns full metadata
- `yt-dlp` unavailable falls back to oEmbed
- malformed video causes explicit error
- oEmbed success still yields title, channel, thumbnail, source URL, embed URL

**Step 2: Implement `yt-dlp` execution**

Example command shape:
```bash
yt-dlp --dump-single-json --skip-download <url>
```

Fields to extract from result:
- `id`
- `title`
- `channel` or `uploader`
- `description`
- `thumbnail`
- `upload_date`
- `duration`

**Step 3: Normalize fields**

- `publishedAt` should be ISO if possible
- `duration` should be formatted like `12:44`
- `sourceUrl` and `embedUrl` should come from normalized parser

**Step 4: Implement oEmbed fallback**

Request:
```text
https://www.youtube.com/oembed?url=<encoded-url>&format=json
```

Minimum fallback output must include:
- title
- channel/author
- thumbnail
- videoId
- sourceUrl
- embedUrl

**Step 5: Re-run tests**

**Step 6: Commit**

```bash
git add <metadata util> <tests>
git commit -m "feat: add youtube metadata extraction"
```

---

### Task B7: Add `youtube` create helper or ingestion command path

**Objective:** Make it easy to create YouTube pins from a URL without hand-crafting JSON.

**Files:**
- Modify: helper CLI script, likely `skill/scripts/corkboard.sh` or repo-local equivalent
- Optionally create: backend route if a dedicated helper endpoint is preferable

**Step 1: Inspect existing helper patterns**

Read current commands for:
- `add-twitter`
- `add-reddit`
- `add-article`

**Step 2: Add new command**

Desired UX:
```bash
bash scripts/corkboard.sh add-youtube "https://youtu.be/abc123xyz00"
```

**Step 3: Use metadata extractor**

The helper should:
- normalize URL
- fetch metadata
- create payload
- POST to `/api/pins`

**Step 4: Add a smoke test or scripted verification**

If shell helpers are tested, add one. If not, document a manual verification command.

**Step 5: Commit**

```bash
git add <helper files>
git commit -m "feat: add youtube pin helper command"
```

---

## Frontend Workstream

### Task F1: Locate current pin renderer switch and card components

**Objective:** Find where `twitter`, `reddit`, `article`, and other pin types are rendered.

**Files:**
- Inspect likely frontend paths such as:
  - `src/components/*`
  - `src/features/pins/*`
  - `src/App.tsx`
  - `src/types/*`

**Step 1: Find renderer switch**

Run something like:
```bash
rg -n "article|twitter|reddit|tracking" src
```

**Step 2: Identify component structure**

Find the exact component and style files to mirror.

**Step 3: Note actual file paths for implementation**

No code change yet.

---

### Task F2: Add shared frontend types for `youtubeData`

**Objective:** Keep frontend typing aligned with backend payloads.

**Files:**
- Modify: actual pin type definitions in frontend/shared code

**Step 1: Add `youtube` to frontend pin union**

**Step 2: Add `youtubeData` type/interface**

**Step 3: Build/typecheck**

Expected: compile fails in renderer switch until `youtube` is handled.

**Step 4: Commit**

```bash
git add <frontend type files>
git commit -m "feat: add frontend youtube pin types"
```

---

### Task F3: Create `YouTubePin` renderer component

**Objective:** Add a dedicated board card with YouTube-specific styling.

**Files:**
- Create: actual component file, e.g. `src/components/YouTubePin.tsx`
- Create/modify: associated style file, e.g. `src/styles/youtube-pin.css`
- Modify: renderer switch file

**Step 1: Write component skeleton**

Props should match existing pin renderers:
```tsx
function YouTubePin({ pin, onToggleComplete, onDelete }: Props) {
  // render card
}
```

**Step 2: Render required board fields**

Show:
- thumbnail (mandatory)
- play overlay
- duration badge if available
- title
- channel
- date
- description snippet
- delete button
- completion/archive control matching existing UX

**Step 3: Wire renderer switch**

Add `youtube` case where the app dispatches pin types to components.

**Step 4: Run frontend build**

Expected: no type errors, card renders in dev environment.

**Step 5: Commit**

```bash
git add <component> <styles> <renderer switch>
git commit -m "feat: add youtube pin card renderer"
```

---

### Task F4: Add modal player behavior

**Objective:** Clicking the card body opens a modal that tries inline playback.

**Files:**
- Modify: `YouTubePin` component or create a companion modal component
- Modify: styles

**Step 1: Add local modal state**

Use the same general UX as richer article cards if one exists.

**Step 2: Render iframe player**

Use `youtubeData.embedUrl`.

Recommended iframe wrapper:
- responsive 16:9 box
- no autoplay by default
- title attribute set
- `allowFullScreen`

**Step 3: Add metadata to modal**

Show:
- title
- channel
- published date
- fuller description
- open button

**Step 4: Add fallback state**

If embed URL missing or embed load visibly fails, show:
- thumbnail
- message like “Inline playback unavailable”
- `Open on YouTube` button

**Step 5: Manual verify in browser**

- click card
- modal opens
- player renders for normal videos
- external link works

**Step 6: Commit**

```bash
git add <component/styles>
git commit -m "feat: add youtube modal playback"
```

---

### Task F5: Polish card styling to match board identity

**Objective:** Make the card feel native to corkie and recognizably YouTube-themed.

**Files:**
- Modify: YouTube card styles

**Design targets:**
- red accent or header
- 16:9 thumbnail dominant
- readable title clamp
- subtle channel/date metadata row
- description clamp to 2–3 lines
- duration badge bottom-right on thumbnail
- hover/open affordance

**Step 1: Tune spacing, truncation, and badge visibility**

**Step 2: Verify dark/light board aesthetics if applicable**

**Step 3: Verify long titles and missing description cases**

**Step 4: Commit**

```bash
git add <styles>
git commit -m "style: polish youtube pin presentation"
```

---

## QA / Testing Workstream

### Task Q1: Add backend integration test for end-to-end create + fetch

**Objective:** Prove a YouTube pin survives the whole API flow.

**Files:**
- Modify/create: backend integration test file

**Test:**
1. create youtube pin
2. fetch `/api/pins`
3. assert returned pin contains `youtubeData`
4. assert required metadata remains intact

**Run:**
```bash
npm test -- pins
```

**Commit:**
```bash
git add <tests>
git commit -m "test: cover youtube pin api roundtrip"
```

---

### Task Q2: Add frontend rendering test if test setup exists

**Objective:** Verify the renderer shows the expected fields.

**Files:**
- Create/modify: frontend component test file, e.g. `src/components/YouTubePin.test.tsx`

**Assertions:**
- thumbnail image present
- title visible
- channel visible
- duration badge visible when provided
- clicking opens modal
- modal contains open button

**Run:**
```bash
npm test -- YouTubePin
```

**Commit:**
```bash
git add <test files>
git commit -m "test: cover youtube pin renderer"
```

If no frontend tests exist, skip adding a whole test framework just for this. YAGNI. Do manual QA instead.

---

### Task Q3: Manual QA checklist

**Objective:** Verify the real user flow works cleanly.

**Manual steps:**
1. Install `yt-dlp` if missing.
2. Start backend/frontend locally.
3. Run helper command with a normal YouTube URL.
4. Confirm pin appears on board.
5. Confirm thumbnail loads.
6. Confirm title/channel/date/description appear.
7. Click card.
8. Confirm modal opens.
9. Confirm inline player loads for a normal embeddable video.
10. Confirm `Open on YouTube` works.
11. Test `youtu.be` URL.
12. Test `shorts` URL.
13. Test malformed/non-YouTube URL and confirm a clean error.
14. Test a video where metadata is partial and confirm graceful rendering.

**No commit needed** unless QA reveals a bug.

---

## Documentation Workstream

### Task D1: Update pin type reference docs

**Objective:** Document the new `youtube` type and payload.

**Files:**
- Modify: skill/docs file like `references/pin-types.md`
- Modify: `references/api.md`

**Step 1: Add `youtube` to pin type list**

**Step 2: Document `youtubeData` fields**

**Step 3: Add create example**

Example:
```bash
curl -X POST "$CORKBOARD_API/api/pins" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"youtube",
    "title":"Demo video",
    "url":"https://www.youtube.com/watch?v=abc123xyz00",
    "youtubeData":{
      "videoId":"abc123xyz00",
      "thumbnailUrl":"https://i.ytimg.com/vi/abc123xyz00/hqdefault.jpg",
      "channelTitle":"Demo Channel",
      "duration":"12:44",
      "embedUrl":"https://www.youtube.com/embed/abc123xyz00"
    }
  }'
```

**Step 4: Commit**

```bash
git add <docs files>
git commit -m "docs: add youtube pin reference"
```

---

### Task D2: Update helper usage docs

**Objective:** Make the helper discoverable.

**Files:**
- Modify: skill `SKILL.md`
- Modify: helper usage docs / setup docs

**Step 1: Add `add-youtube` command example**

```bash
bash "$baseDir/scripts/corkboard.sh" add-youtube "https://youtu.be/abc123xyz00"
```

**Step 2: Note `yt-dlp` dependency**

Document installation commands per platform.

**Step 3: Note fallback behavior**

If `yt-dlp` is absent, system falls back to oEmbed and metadata may be limited.

**Step 4: Commit**

```bash
git add <docs>
git commit -m "docs: add youtube helper usage"
```

---

## Suggested Commands

The implementer should adapt to the actual repo tooling, but likely commands include:

```bash
# install dependencies
npm install

# install yt-dlp if needed
# Ubuntu/Debian example
sudo apt-get update && sudo apt-get install -y yt-dlp

# or via pipx if preferred
pipx install yt-dlp

# run backend/frontend dev servers
npm run dev

# typecheck
npm run typecheck

# backend tests
npm test

# targeted grep for implementation points
rg -n "articleData|twitter|reddit|PinType|/api/pins" .
```

---

## Acceptance Criteria

### Ingestion
- [ ] A supported YouTube URL can be passed through helper or internal create flow.
- [ ] URL is normalized to canonical watch URL.
- [ ] Metadata extraction succeeds through `yt-dlp`, with oEmbed fallback.

### Data/API
- [ ] Backend accepts valid `youtube` payloads.
- [ ] Backend rejects malformed `youtube` payloads.
- [ ] `youtubeData` survives create/fetch/update roundtrip.

### UI
- [ ] Card is clearly YouTube-themed.
- [ ] Thumbnail is mandatory and renders correctly.
- [ ] Title renders correctly.
- [ ] Channel renders when available.
- [ ] Published date renders when available.
- [ ] Description snippet renders when available.
- [ ] Duration badge renders when available.

### Interaction
- [ ] Clicking card opens modal.
- [ ] Modal attempts inline embed playback.
- [ ] Fallback to `Open on YouTube` works cleanly.

### Compatibility
- [ ] Existing pin types still render unchanged.
- [ ] Existing `/api/pins` behavior remains compatible.

---

## Risks / Watchouts

- `yt-dlp` may fail on some videos or environments; fallback must be graceful.
- Some videos block embedding; modal fallback is required.
- Shorts/live URL normalization can be subtly annoying; test them explicitly.
- If backend schema is column-based rather than JSON-based, persistence work may be slightly more involved than expected.
- Do not overbuild playlists, transcripts, or analytics into v1.

---

## Recommended Commit Sequence

1. `test: define youtube pin validation contract`
2. `feat: add youtube pin schema`
3. `feat: persist youtube pin metadata`
4. `feat: add youtube url normalization`
5. `feat: add youtube metadata extraction`
6. `feat: add youtube pin helper command`
7. `feat: add frontend youtube pin types`
8. `feat: add youtube pin card renderer`
9. `feat: add youtube modal playback`
10. `style: polish youtube pin presentation`
11. `test: cover youtube pin api roundtrip`
12. `docs: add youtube pin reference`
13. `docs: add youtube helper usage`

---

## Final Handoff

Implement this with TDD where the repo already supports tests. Keep scope tight. Get the happy path clean first, then handle fallback states. The whole point is to make pasted YouTube URLs feel as native and polished as GitHub/Twitter/Reddit cards already do.
