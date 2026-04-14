#!/usr/bin/env node
/**
 * clean-demo.mjs — Remove demo data created by seed-demo.mjs.
 *
 * Reads the manifest at scripts/.demo-manifest.json and soft-deletes
 * only the pins and projects listed there. Real data is never touched.
 */

import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = resolve(__dirname, '.demo-manifest.json');

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

// ─── API Helper ──────────────────────────────────────────

async function del(path) {
  const res = await fetch(`${API}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  // 404 is fine — already deleted
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`DELETE ${path} failed (${res.status}): ${text}`);
  }
  return res.ok;
}

// ─── Main ────────────────────────────────────────────────

export default async function clean() {
  if (!existsSync(MANIFEST_PATH)) {
    console.log('No manifest found. Nothing to clean.');
    return;
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  console.log(`Cleaning demo data from ${manifest.createdAt}...\n`);

  let removed = 0;
  let skipped = 0;

  // Delete pins
  for (const id of manifest.pinIds ?? []) {
    const ok = await del(`/pins/${id}`);
    if (ok) {
      console.log(`  - Pin ${id}`);
      removed++;
    } else {
      console.log(`  ~ Pin ${id} (already gone)`);
      skipped++;
    }
  }

  // Delete projects
  for (const id of manifest.projectIds ?? []) {
    const ok = await del(`/projects/${id}`);
    if (ok) {
      console.log(`  - Project ${id}`);
      removed++;
    } else {
      console.log(`  ~ Project ${id} (already gone)`);
      skipped++;
    }
  }

  // Remove manifest file
  unlinkSync(MANIFEST_PATH);

  console.log(`\nDone! Removed ${removed}, skipped ${skipped}.`);
  console.log('Manifest deleted.');
}

// Run directly or imported by seed-demo.mjs --clean
if (process.argv[1]?.endsWith('clean-demo.mjs')) {
  clean().catch((err) => {
    console.error('Failed:', err.message);
    console.error('Is the dev server running? (npm run dev)');
    process.exit(1);
  });
}
