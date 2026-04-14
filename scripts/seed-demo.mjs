#!/usr/bin/env node
/**
 * seed-demo.mjs — Populate the corkboard with realistic demo data.
 *
 * Usage:
 *   node scripts/seed-demo.mjs          # seed all demo data
 *   node scripts/seed-demo.mjs --clean  # shortcut for clean-demo.mjs
 *
 * Requires the dev server running on localhost:3010.
 * Reads CORKBOARD_TOKEN from the repo-root .env file.
 * Writes a manifest to scripts/.demo-manifest.json for cleanup.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = resolve(__dirname, '.demo-manifest.json');

// ─── YouTube Configuration ───────────────────────────────
// Real Rick Astley metadata — the joke is the unannounced Rickroll hiding
// in plain sight on the demo board.
const YOUTUBE_VIDEO_ID    = 'dQw4w9WgXcQ';
const YOUTUBE_TITLE       = 'Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)';
const YOUTUBE_CHANNEL     = 'Rick Astley';
const YOUTUBE_DURATION    = '3:34';
const YOUTUBE_PUBLISHED   = '2009-10-25T06:57:33Z';
const YOUTUBE_DESCRIPTION = 'The official video for "Never Gonna Give You Up" by Rick Astley. A global smash on release in July 1987, topping charts in 25 countries.';

// ─── Load token from .env ────────────────────────────────

function loadToken() {
  const envPath = resolve(ROOT, '.env');
  const env = readFileSync(envPath, 'utf-8');
  const match = env.match(/^CORKBOARD_TOKEN=(.+)$/m);
  if (!match) throw new Error('CORKBOARD_TOKEN not found in .env');
  return match[1].trim();
}

const TOKEN = loadToken();
const API = 'http://localhost:3010/api';

// ─── API Helpers ─────────────────────────────────────────

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function patch(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function del(path) {
  const res = await fetch(`${API}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${path} failed (${res.status}): ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function get(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ─── Dynamic Dates ───────────────────────────────────────

function tomorrowAt(hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ─── Pin Definitions ─────────────────────────────────────

const PINS = [
  {
    type: 'task',
    title: 'Prep walnut slab for river table',
    content: [
      '- [x] Rough cut to length',
      '- [x] Flatten with router sled',
      '- [ ] Fill bark voids with epoxy',
      '- [ ] Final sand to 220 grit',
    ].join('\n'),
    priority: 1,
  },
  {
    type: 'github',
    title: 'carls-corkie',
    content: 'Your AI-powered corkboard — built for ADHD brains',
    repo: 'Grooves-n-Grain/carls-corkie',
    url: 'https://github.com/Grooves-n-Grain/carls-corkie',
    stars: 28,
    forks: 4,
  },
  {
    type: 'youtube',
    title: YOUTUBE_TITLE,
    url: `https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`,
    youtubeData: {
      videoId: YOUTUBE_VIDEO_ID,
      thumbnailUrl: `https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`,
      channelTitle: YOUTUBE_CHANNEL,
      description: YOUTUBE_DESCRIPTION,
      duration: YOUTUBE_DURATION,
      publishedAt: YOUTUBE_PUBLISHED,
      embedUrl: `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`,
      sourceUrl: `https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`,
    },
  },
  {
    type: 'twitter',
    title: 'Andrej Karpathy',
    content:
      "I've never felt this much behind as a programmer. The profession is being dramatically refactored as the bits contributed by the programmer are increasingly sparse and between.",
    url: 'https://x.com/karpathy/status/2024997757757653224',
  },
  {
    type: 'reddit',
    title: 'First live edge table — black walnut with clear epoxy',
    content:
      'Finally finished my first live edge project. 8/4 black walnut, Ecopoxy FlowCast, and way too many hours of sanding. Worth every minute.',
    url: 'https://reddit.com/r/woodworking/comments/abc123/first_live_edge_table',
  },
  {
    type: 'event',
    title: 'Client pickup — live edge desk',
    content: 'Johnson order — bring furniture pads and touch-up kit',
    dueAt: tomorrowAt(10),
  },
  {
    type: 'alert',
    title: 'Dust collector filter at 92% — replace before next session',
    content:
      'Last cleaned 3 weeks ago. Running walnut and epoxy dust — don\'t skip this one.',
  },
];

// ─── Project Definitions ─────────────────────────────────

const PROJECTS = [
  {
    create: {
      name: 'Shop Inventory App',
      emoji: '📦',
      color: '#4ecdc4',
      phase: 'build',
      tracks: [
        { name: 'Database & API', owner: 'claude' },
        { name: 'Barcode Scanners', owner: 'you' },
        { name: 'User Guide', owner: 'shared' },
      ],
    },
    trackSetup: [
      {
        // Track 0: Database & API — claude, done, 4/4
        status: 'done',
        tasks: [
          { id: randomUUID(), text: 'Design schema', done: true },
          { id: randomUUID(), text: 'Build REST endpoints', done: true },
          { id: randomUUID(), text: 'Add search & filter', done: true },
          { id: randomUUID(), text: 'Write tests', done: true },
        ],
      },
      {
        // Track 1: Barcode Scanners — you, active, 2/4
        status: 'active',
        tasks: [
          { id: randomUUID(), text: 'Order USB scanners', done: true },
          { id: randomUUID(), text: 'Mount scanning station', done: true },
          { id: randomUUID(), text: 'Wire to shop network', done: false },
          { id: randomUUID(), text: 'Test with inventory labels', done: false },
        ],
      },
      {
        // Track 2: User Guide — shared, waiting, 0/3
        tasks: [
          { id: randomUUID(), text: 'Write setup instructions', done: false },
          { id: randomUUID(), text: 'Add screenshots', done: false },
          { id: randomUUID(), text: 'Record walkthrough video', done: false },
        ],
      },
    ],
  },
  {
    create: {
      name: 'CNC Pattern Library',
      emoji: '🔲',
      color: '#c3a6ff',
      phase: 'concept',
      tracks: [
        { name: 'Design Templates', owner: 'you' },
        { name: 'Web Gallery', owner: 'claude' },
      ],
    },
    trackSetup: [
      {
        // Track 0: Design Templates — you, active, 1/3
        tasks: [
          { id: randomUUID(), text: 'Sketch 5 base patterns', done: true },
          { id: randomUUID(), text: 'Convert to SVG', done: false },
          { id: randomUUID(), text: 'Test cuts on scrap', done: false },
        ],
      },
      {
        // Track 1: Web Gallery — claude, waiting, 0/3
        tasks: [
          { id: randomUUID(), text: 'Build gallery page', done: false },
          { id: randomUUID(), text: 'Add download links', done: false },
          { id: randomUUID(), text: 'SEO & metadata', done: false },
        ],
      },
    ],
  },
];

// ─── Main ────────────────────────────────────────────────

async function seedPins() {
  console.log('\n--- Seeding Pins ---');
  const pinIds = [];

  for (const pinData of PINS) {
    const pin = await post('/pins', pinData);
    pinIds.push(pin.id);
    console.log(`  + ${pin.type.padEnd(8)} "${pin.title}" (${pin.id})`);
  }

  return pinIds;
}

async function seedProjects() {
  console.log('\n--- Seeding Projects ---');
  const projectIds = [];
  const autoPinIds = [];

  for (const { create, trackSetup } of PROJECTS) {
    // Snapshot pin IDs before patching tracks (to detect auto-created bridge tasks)
    const pinsBefore = new Set((await get('/pins')).map((p) => p.id));

    const project = await post('/projects', create);
    projectIds.push(project.id);
    console.log(`  + Project "${project.name}" (${project.id})`);

    // Patch each track with tasks and optional status override
    for (let i = 0; i < project.tracks.length; i++) {
      const track = project.tracks[i];
      const setup = trackSetup[i];
      if (!setup) continue;

      const patchBody = { tasks: setup.tasks };
      if (setup.status) patchBody.status = setup.status;

      await patch(`/projects/${project.id}/tracks/${track.id}`, patchBody);

      const doneCount = setup.tasks.filter((t) => t.done).length;
      const total = setup.tasks.length;
      const status = setup.status ?? track.status;
      console.log(
        `    - ${track.name} [${track.owner}] ${status} (${doneCount}/${total})`
      );
    }

    // Clean up auto-created bridge task pins (triggered by setting tracks to done)
    const pinsAfter = await get('/pins');
    for (const pin of pinsAfter) {
      if (!pinsBefore.has(pin.id)) {
        await del(`/pins/${pin.id}`);
        autoPinIds.push(pin.id);
        console.log(`    ~ auto-pin cleaned: "${pin.title}"`);
      }
    }
  }

  return { projectIds, autoPinIds };
}

async function main() {
  // Handle --clean shortcut
  if (process.argv.includes('--clean')) {
    const { default: clean } = await import('./clean-demo.mjs');
    if (typeof clean === 'function') await clean();
    return;
  }

  console.log('Seeding demo data...');
  console.log(`API: ${API}`);

  try {
    const pinIds = await seedPins();
    const { projectIds, autoPinIds } = await seedProjects();

    // Write manifest for cleanup
    const manifest = {
      createdAt: new Date().toISOString(),
      pinIds,
      projectIds,
      autoPinIds,
    };
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\nManifest saved to ${MANIFEST_PATH}`);

    const autoMsg = autoPinIds.length ? ` (${autoPinIds.length} bridge task auto-pins cleaned)` : '';
    console.log(`\nDone! Created ${pinIds.length} pins and ${projectIds.length} projects.${autoMsg}`);
    console.log('Run "node scripts/clean-demo.mjs" to remove demo data.');
  } catch (err) {
    console.error('\nFailed:', err.message);
    console.error('Is the dev server running? (npm run dev)');
    process.exit(1);
  }
}

main();
