import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'corkboard.db');

const PIN_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS pins (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'snoozed', 'dismissed')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    url TEXT,
    due_at TEXT,
    priority INTEGER CHECK(priority IS NULL OR (priority >= 1 AND priority <= 3)),
    deleted_at TEXT,
    email_from TEXT,
    email_date TEXT,
    email_id TEXT,
    repo TEXT,
    stars INTEGER,
    forks INTEGER,
    idea_verdict TEXT,
    idea_scores TEXT,
    idea_competitors INTEGER,
    idea_effort_estimate TEXT,
    idea_research_summary TEXT,
    tracking_number TEXT,
    tracking_carrier TEXT,
    tracking_status TEXT,
    tracking_location TEXT,
    tracking_eta TEXT,
    tracking_last_update TEXT,
    tracking_url TEXT,
    article_data TEXT,
    youtube_data TEXT
  );
`;

const PIN_OPTIONAL_COLUMNS = [
  ['deleted_at', 'TEXT'],
  ['email_from', 'TEXT'],
  ['email_date', 'TEXT'],
  ['email_id', 'TEXT'],
  ['repo', 'TEXT'],
  ['stars', 'INTEGER'],
  ['forks', 'INTEGER'],
  ['idea_verdict', 'TEXT'],
  ['idea_scores', 'TEXT'],
  ['idea_competitors', 'INTEGER'],
  ['idea_effort_estimate', 'TEXT'],
  ['idea_research_summary', 'TEXT'],
  ['tracking_number', 'TEXT'],
  ['tracking_carrier', 'TEXT'],
  ['tracking_status', 'TEXT'],
  ['tracking_location', 'TEXT'],
  ['tracking_eta', 'TEXT'],
  ['tracking_last_update', 'TEXT'],
  ['tracking_url', 'TEXT'],
  ['article_data', 'TEXT'],
  ['youtube_data', 'TEXT'],
] as const;

const PIN_ALL_COLUMNS = [
  'id',
  'type',
  'title',
  'content',
  'status',
  'created_at',
  'updated_at',
  'url',
  'due_at',
  'priority',
  'deleted_at',
  'email_from',
  'email_date',
  'email_id',
  'repo',
  'stars',
  'forks',
  'idea_verdict',
  'idea_scores',
  'idea_competitors',
  'idea_effort_estimate',
  'idea_research_summary',
  'tracking_number',
  'tracking_carrier',
  'tracking_status',
  'tracking_location',
  'tracking_eta',
  'tracking_last_update',
  'tracking_url',
  'article_data',
  'youtube_data',
] as const;

function resolveDbPath(): string {
  return process.env.CORKBOARD_DB_PATH?.trim() || DEFAULT_DB_PATH;
}

function getTableSql(db: DatabaseType, tableName: string): string | null {
  const row = db.prepare(`
    SELECT sql FROM sqlite_master
    WHERE type = 'table' AND name = ?
  `).get(tableName) as { sql: string | null } | undefined;

  return row?.sql ?? null;
}

function getTableColumns(db: DatabaseType, tableName: string): string[] {
  return (db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>).map((column) => column.name);
}

function createPinIndexes(db: DatabaseType): void {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pins_status ON pins(status);
    CREATE INDEX IF NOT EXISTS idx_pins_priority ON pins(priority);
  `);
}

function createPinsTable(db: DatabaseType): void {
  db.exec(PIN_TABLE_SQL);
  createPinIndexes(db);
}

const PROJECTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '🔧',
    color TEXT DEFAULT '#e8a838',
    phase TEXT DEFAULT 'concept' CHECK(phase IN ('concept','build','polish','publish','shipped')),
    project_status TEXT DEFAULT 'active' CHECK(project_status IN ('active','on-hold','archived','cellar')),
    hold_reason TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT DEFAULT NULL
  );
`;

const PROJECT_COLUMNS = [
  'id', 'name', 'emoji', 'color', 'phase',
  'project_status', 'hold_reason', 'created_at', 'updated_at', 'deleted_at',
] as const;

function createProjectsTable(db: DatabaseType): void {
  db.exec(PROJECTS_TABLE_SQL);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);`);
}

function migrateProjectStatusConstraint(db: DatabaseType): void {
  // Use legacy_alter_table to prevent SQLite 3.26+ from auto-updating FK
  // references in project_tracks when we rename the projects table.
  db.pragma('legacy_alter_table = ON');
  const migrate = db.transaction(() => {
    const legacyTable = 'projects_legacy';
    const existingColumns = getTableColumns(db, 'projects');

    db.exec(`ALTER TABLE projects RENAME TO ${legacyTable}`);
    createProjectsTable(db);

    const transferable = (PROJECT_COLUMNS as readonly string[]).filter((c) => existingColumns.includes(c));
    const columnList = transferable.join(', ');
    db.exec(`INSERT INTO projects (${columnList}) SELECT ${columnList} FROM ${legacyTable}`);

    db.exec(`DROP TABLE ${legacyTable}`);
  });
  try {
    migrate();
  } finally {
    db.pragma('legacy_alter_table = OFF');
  }
}

function repairProjectTracksFk(db: DatabaseType): void {
  // Rebuild project_tracks with correct REFERENCES projects(id) after a
  // previous migration run that allowed SQLite to auto-update the FK to
  // point at the now-dropped projects_legacy table.
  db.pragma('legacy_alter_table = ON');
  const repair = db.transaction(() => {
    const legacyTable = 'project_tracks_legacy';
    const existingColumns = getTableColumns(db, 'project_tracks');

    db.exec(`ALTER TABLE project_tracks RENAME TO ${legacyTable}`);
    db.exec(`
      CREATE TABLE project_tracks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        owner TEXT DEFAULT 'you' CHECK(owner IN ('claude','you','shared')),
        status TEXT DEFAULT 'waiting' CHECK(status IN ('active','waiting','done','locked')),
        tasks TEXT DEFAULT '[]',
        attachment TEXT DEFAULT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_project_tracks_project ON project_tracks(project_id);
    `);

    const target = ['id', 'project_id', 'name', 'owner', 'status', 'tasks', 'attachment', 'sort_order', 'created_at', 'updated_at'];
    const transferable = target.filter((c) => existingColumns.includes(c));
    const columnList = transferable.join(', ');
    db.exec(`INSERT INTO project_tracks (${columnList}) SELECT ${columnList} FROM ${legacyTable}`);
    db.exec(`DROP TABLE ${legacyTable}`);
  });
  try {
    repair();
  } finally {
    db.pragma('legacy_alter_table = OFF');
  }
}

function ensureProjectsTable(db: DatabaseType): void {
  const tableSql = getTableSql(db, 'projects');
  if (!tableSql) {
    createProjectsTable(db);
    return;
  }
  if (!tableSql.includes("'cellar'")) {
    migrateProjectStatusConstraint(db);
  }
  // Repair project_tracks FK if a previous migration run let SQLite 3.26+
  // auto-update it to reference the now-dropped projects_legacy table.
  const tracksSql = getTableSql(db, 'project_tracks');
  if (tracksSql?.includes('projects_legacy')) {
    repairProjectTracksFk(db);
  }
}

function ensureOptionalPinColumns(db: DatabaseType): void {
  const existing = new Set(getTableColumns(db, 'pins'));

  for (const [name, definition] of PIN_OPTIONAL_COLUMNS) {
    if (!existing.has(name)) {
      db.exec(`ALTER TABLE pins ADD COLUMN ${name} ${definition}`);
    }
  }

  createPinIndexes(db);
}

function migrateLegacyPinTypeConstraint(db: DatabaseType): void {
  const migrate = db.transaction(() => {
    const legacyTable = 'pins_legacy';
    const existingColumns = getTableColumns(db, 'pins');

    db.exec(`ALTER TABLE pins RENAME TO ${legacyTable}`);
    createPinsTable(db);

    const transferableColumns = PIN_ALL_COLUMNS.filter((column) => existingColumns.includes(column));

    if (transferableColumns.length > 0) {
      const columnList = transferableColumns.join(', ');
      db.exec(`INSERT INTO pins (${columnList}) SELECT ${columnList} FROM ${legacyTable}`);
    }

    db.exec(`DROP TABLE ${legacyTable}`);
  });

  migrate();
}

function ensurePinsTable(db: DatabaseType): void {
  const tableSql = getTableSql(db, 'pins');

  if (!tableSql) {
    createPinsTable(db);
    return;
  }

  if (tableSql.includes('CHECK(type IN')) {
    migrateLegacyPinTypeConstraint(db);
    return;
  }

  ensureOptionalPinColumns(db);
}

export function createDatabase(dbPath = resolveDbPath()): DatabaseType {
  mkdirSync(path.dirname(dbPath), { recursive: true });

  const db: DatabaseType = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  ensurePinsTable(db);

// ─── Project Pipeline Tables ─────────────────────────────
  ensureProjectsTable(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_tracks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      owner TEXT DEFAULT 'you' CHECK(owner IN ('claude','you','shared')),
      status TEXT DEFAULT 'waiting' CHECK(status IN ('active','waiting','done','locked')),
      tasks TEXT DEFAULT '[]',
      attachment TEXT DEFAULT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_project_tracks_project ON project_tracks(project_id);
  `);

// Seed welcome pin if database is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM pins').get() as { count: number };
  if (count.count === 0) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO pins (id, type, title, content, status, created_at, updated_at, priority)
      VALUES (?, 'task', 'Welcome to your corkboard!', 'This is your first pin. Click the checkbox to complete it.', 'active', ?, ?, 2)
    `).run(uuidv4(), now, now);
  }

  return db;
}

const db: DatabaseType = createDatabase();

export default db;
