import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync, type ExecFileSyncOptions } from 'child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SCRIPT = resolve(__dirname, '../../../scripts/ensure-token.mjs');

function runScript(cwd: string, args: string[] = []): { stdout: string; stderr: string; status: number } {
  const opts: ExecFileSyncOptions = {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CORKBOARD_TOKEN: '', CORKBOARD_AUTH: '' },
  };
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], opts).toString();
    return { stdout, stderr: '', status: 0 };
  } catch (err) {
    const e = err as { stdout?: Buffer | string; stderr?: Buffer | string; status?: number };
    return {
      stdout: e.stdout?.toString() ?? '',
      stderr: e.stderr?.toString() ?? '',
      status: e.status ?? 1,
    };
  }
}

function readEnv(dir: string): Record<string, string> {
  const raw = readFileSync(join(dir, '.env'), 'utf8');
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=(.*)$/i);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

describe('ensure-token.mjs', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'corkie-token-test-'));
    writeFileSync(
      join(tempDir, '.env.example'),
      ['# header', 'PORT=3010', 'CORKBOARD_TOKEN=', 'VITE_CORKBOARD_TOKEN=', ''].join('\n'),
    );
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('--show on a fresh repo (no .env) prints "(no token set)" and exits 0', () => {
    const r = runScript(tempDir, ['--show']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('(no token set)');
  });

  it('first run with no args copies .env.example to .env and generates a 64-char hex token', () => {
    const r = runScript(tempDir);
    expect(r.status).toBe(0);
    expect(existsSync(join(tempDir, '.env'))).toBe(true);
    const env = readEnv(tempDir);
    expect(env.CORKBOARD_TOKEN).toMatch(/^[0-9a-f]{64}$/);
    expect(env.VITE_CORKBOARD_TOKEN).toBe(env.CORKBOARD_TOKEN);
    expect(r.stdout).toContain('auto-generated');
  });

  it('second run is idempotent and preserves the existing token', () => {
    runScript(tempDir);
    const first = readEnv(tempDir);
    const r = runScript(tempDir);
    expect(r.status).toBe(0);
    const second = readEnv(tempDir);
    expect(second.CORKBOARD_TOKEN).toBe(first.CORKBOARD_TOKEN);
    expect(second.VITE_CORKBOARD_TOKEN).toBe(first.VITE_CORKBOARD_TOKEN);
  });

  it('--rotate generates a new token different from the previous one', () => {
    runScript(tempDir);
    const before = readEnv(tempDir);
    const r = runScript(tempDir, ['--rotate']);
    expect(r.status).toBe(0);
    const after = readEnv(tempDir);
    expect(after.CORKBOARD_TOKEN).toMatch(/^[0-9a-f]{64}$/);
    expect(after.CORKBOARD_TOKEN).not.toBe(before.CORKBOARD_TOKEN);
    expect(after.VITE_CORKBOARD_TOKEN).toBe(after.CORKBOARD_TOKEN);
    expect(r.stdout).toContain('rotated');
  });

  it('--show prints the existing token after generation', () => {
    runScript(tempDir);
    const env = readEnv(tempDir);
    const r = runScript(tempDir, ['--show']);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toContain(env.CORKBOARD_TOKEN);
  });

  it('preserves other env vars when generating', () => {
    writeFileSync(
      join(tempDir, '.env'),
      ['PORT=3010', 'HA_TOKEN=keepme', 'CORKBOARD_TOKEN=', 'VITE_CORKBOARD_TOKEN=', ''].join('\n'),
    );
    const r = runScript(tempDir);
    expect(r.status).toBe(0);
    const env = readEnv(tempDir);
    expect(env.HA_TOKEN).toBe('keepme');
    expect(env.PORT).toBe('3010');
    expect(env.CORKBOARD_TOKEN).toMatch(/^[0-9a-f]{64}$/);
  });

  it('errors out when neither .env nor .env.example exists', () => {
    rmSync(join(tempDir, '.env.example'));
    const r = runScript(tempDir);
    expect(r.status).not.toBe(0);
    expect(r.stderr + r.stdout).toMatch(/\.env\.example/);
  });

  it('appends CORKBOARD_TOKEN if missing from existing .env', () => {
    writeFileSync(join(tempDir, '.env'), 'PORT=3010\n');
    const r = runScript(tempDir);
    expect(r.status).toBe(0);
    const env = readEnv(tempDir);
    expect(env.CORKBOARD_TOKEN).toMatch(/^[0-9a-f]{64}$/);
    expect(env.VITE_CORKBOARD_TOKEN).toBe(env.CORKBOARD_TOKEN);
    expect(env.PORT).toBe('3010');
  });
});
