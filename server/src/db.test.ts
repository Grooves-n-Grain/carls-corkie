import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import Database from 'better-sqlite3';
import { createDatabase } from './db.js';

describe('database bootstrap', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    while (tempDirs.length > 0) {
      const directory = tempDirs.pop();
      if (directory) {
        rmSync(directory, { recursive: true, force: true });
      }
    }
  });

  it('creates a fresh pins table with tracking and article columns intact', () => {
    const directory = mkdtempSync(join(tmpdir(), 'corkboard-db-'));
    tempDirs.push(directory);

    const dbPath = join(directory, 'corkboard.db');
    const db = createDatabase(dbPath);

    const columns = (db.prepare('PRAGMA table_info(pins)').all() as Array<{ name: string }>).map((column) => column.name);
    expect(columns).toContain('tracking_number');
    expect(columns).toContain('tracking_carrier');
    expect(columns).toContain('article_data');

    const now = new Date().toISOString();
    const articleData = JSON.stringify({
      url: 'https://example.com/story',
      source: 'Example News',
      tldr: 'Short summary',
      bullets: ['Point one'],
    });

    db.prepare(`
      INSERT INTO pins (
        id, type, title, content, status, created_at, updated_at, priority,
        tracking_number, tracking_carrier, tracking_status, tracking_url, article_data
      ) VALUES (
        ?, 'tracking', 'Tracked package', 'Package update', 'active', ?, ?, 2,
        ?, ?, ?, ?, ?
      )
    `).run(
      'tracking-pin',
      now,
      now,
      '1Z999AA10123456784',
      'UPS',
      'in-transit',
      'https://www.ups.com/track?tracknum=1Z999AA10123456784',
      articleData
    );

    const inserted = db.prepare(`
      SELECT tracking_number, tracking_carrier, tracking_status, tracking_url, article_data
      FROM pins
      WHERE id = ?
    `).get('tracking-pin') as {
      tracking_number: string;
      tracking_carrier: string;
      tracking_status: string;
      tracking_url: string;
      article_data: string;
    };

    expect(inserted.tracking_number).toBe('1Z999AA10123456784');
    expect(inserted.tracking_carrier).toBe('UPS');
    expect(inserted.tracking_status).toBe('in-transit');
    expect(inserted.tracking_url).toBe('https://www.ups.com/track?tracknum=1Z999AA10123456784');
    expect(JSON.parse(inserted.article_data)).toEqual({
      url: 'https://example.com/story',
      source: 'Example News',
      tldr: 'Short summary',
      bullets: ['Point one'],
    });

    db.close();
  });

  it('creates a fresh projects table accepting cellar status', () => {
    const directory = mkdtempSync(join(tmpdir(), 'corkboard-db-'));
    tempDirs.push(directory);
    const dbPath = join(directory, 'corkboard.db');
    const db = createDatabase(dbPath);

    const row = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='projects'"
    ).get() as { sql: string };
    expect(row.sql).toContain("'cellar'");

    db.close();
  });

  it('migrates an existing projects table to accept cellar status', () => {
    const directory = mkdtempSync(join(tmpdir(), 'corkboard-db-'));
    tempDirs.push(directory);
    const dbPath = join(directory, 'corkboard.db');

    // Seed a legacy DB without cellar in the constraint
    const legacy = new Database(dbPath);
    legacy.exec(`
      CREATE TABLE pins (
        id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL,
        content TEXT, status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        priority INTEGER
      );
      INSERT INTO pins (id, type, title, status, created_at, updated_at)
        VALUES ('seed', 'task', 'Seed', 'active', datetime('now'), datetime('now'));
      CREATE TABLE projects (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        emoji TEXT DEFAULT '🔧', color TEXT DEFAULT '#e8a838',
        phase TEXT DEFAULT 'concept',
        project_status TEXT DEFAULT 'active' CHECK(project_status IN ('active','on-hold','archived')),
        hold_reason TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT DEFAULT NULL
      );
      INSERT INTO projects (id, name) VALUES ('p1', 'Old Project');
    `);
    legacy.close();

    const db = createDatabase(dbPath);

    const row = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='projects'"
    ).get() as { sql: string };
    expect(row.sql).toContain("'cellar'");

    const project = db.prepare("SELECT name FROM projects WHERE id = 'p1'").get() as { name: string };
    expect(project.name).toBe('Old Project');

    expect(() => {
      db.prepare("UPDATE projects SET project_status = 'cellar' WHERE id = 'p1'").run();
    }).not.toThrow();

    db.close();
  });
});
