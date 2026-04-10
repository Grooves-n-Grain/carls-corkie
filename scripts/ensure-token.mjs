#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = join(ROOT, '.env');
const ENV_EXAMPLE_PATH = join(ROOT, '.env.example');

const args = process.argv.slice(2);
const rotate = args.includes('--rotate');
const show = args.includes('--show');

function readLines(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split(/\r?\n/);
}

function getVar(lines, key) {
  const re = new RegExp(`^\\s*${key}\\s*=(.*)$`);
  for (const line of lines) {
    const m = line.match(re);
    if (m) return m[1].trim();
  }
  return '';
}

function setVar(lines, key, value) {
  const re = new RegExp(`^\\s*${key}\\s*=`);
  const idx = lines.findIndex((l) => re.test(l));
  if (idx >= 0) {
    lines[idx] = `${key}=${value}`;
  } else {
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.splice(lines.length - 1, 0, `${key}=${value}`);
    } else {
      lines.push(`${key}=${value}`);
    }
  }
  return lines;
}

function bail(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

if (show) {
  const lines = readLines(ENV_PATH);
  const tok = getVar(lines, 'CORKBOARD_TOKEN');
  if (!tok) {
    console.log('(no token set)');
  } else {
    console.log(tok);
  }
  process.exit(0);
}

if (!existsSync(ENV_PATH)) {
  if (!existsSync(ENV_EXAMPLE_PATH)) {
    bail('Missing .env.example — cannot bootstrap .env. Create one or run from the repo root.');
  }
  copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
  console.log('Created .env from .env.example');
}

let lines = readLines(ENV_PATH);
const existing = getVar(lines, 'CORKBOARD_TOKEN');

if (!rotate && existing) {
  process.exit(0);
}

const newToken = randomBytes(32).toString('hex');
lines = setVar(lines, 'CORKBOARD_TOKEN', newToken);
lines = setVar(lines, 'VITE_CORKBOARD_TOKEN', newToken);
writeFileSync(ENV_PATH, lines.join('\n'));

const header = rotate ? 'corkie token rotated' : 'corkie auth token auto-generated';
const pad = (s) => s.padEnd(55);
console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║   ${pad(header)} ║
  ║                                                           ║
  ║   Written to .env (gitignored).                           ║
  ║                                                           ║
  ║   Restart server:  npm run pm2:restart   (or ctrl-c dev)  ║
  ║   Rebuild client:  npm run build                          ║
  ║                                                           ║
  ║   Show token:      npm run token:show                     ║
  ║   Rotate again:    npm run token:rotate                   ║
  ║   Disable auth:    set CORKBOARD_AUTH=disabled in .env    ║
  ╚═══════════════════════════════════════════════════════════╝
`);

if (process.env.CORKBOARD_TOKEN && process.env.CORKBOARD_TOKEN !== newToken) {
  console.warn('WARNING: CORKBOARD_TOKEN is set in your shell env with a different value.');
  console.warn('         The shell env will override .env for the server process.');
  console.warn('         Unset it: unset CORKBOARD_TOKEN');
}
