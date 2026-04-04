import { v4 as uuidv4 } from 'uuid';
import type { Pin, CreatePinRequest, UpdatePinRequest } from '@corkboard/shared';
import db from './db.js';

// Row type from database (snake_case)
interface PinRow {
  id: string;
  type: string;
  title: string;
  content: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  url: string | null;
  due_at: string | null;
  priority: number | null;
  deleted_at: string | null;
  email_from: string | null;
  email_date: string | null;
  email_id: string | null;
  repo: string | null;
  stars: number | null;
  forks: number | null;
  idea_verdict: string | null;
  idea_scores: string | null;  // JSON string
  idea_competitors: number | null;
  idea_effort_estimate: string | null;
  idea_research_summary: string | null;
  // Package tracking fields
  tracking_number: string | null;
  tracking_carrier: string | null;
  tracking_status: string | null;
  tracking_location: string | null;
  tracking_eta: string | null;
  tracking_last_update: string | null;
  tracking_url: string | null;
  article_data: string | null;  // JSON string
}

// Convert database row to Pin object
function rowToPin(row: PinRow): Pin {
  return {
    id: row.id,
    type: row.type as Pin['type'],
    title: row.title,
    content: row.content ?? undefined,
    status: row.status as Pin['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    url: row.url ?? undefined,
    dueAt: row.due_at ?? undefined,
    priority: row.priority ?? undefined,
    emailFrom: row.email_from ?? undefined,
    emailDate: row.email_date ?? undefined,
    emailId: row.email_id ?? undefined,
    repo: row.repo ?? undefined,
    stars: row.stars ?? undefined,
    forks: row.forks ?? undefined,
    ideaVerdict: (row.idea_verdict as Pin['ideaVerdict']) ?? undefined,
    ideaScores: row.idea_scores ? JSON.parse(row.idea_scores) : undefined,
    ideaCompetitors: row.idea_competitors ?? undefined,
    ideaEffortEstimate: row.idea_effort_estimate ?? undefined,
    ideaResearchSummary: row.idea_research_summary ?? undefined,
    // Package tracking fields
    trackingNumber: row.tracking_number ?? undefined,
    trackingCarrier: row.tracking_carrier ?? undefined,
    trackingStatus: (row.tracking_status as Pin['trackingStatus']) ?? undefined,
    trackingLocation: row.tracking_location ?? undefined,
    trackingEta: row.tracking_eta ?? undefined,
    trackingLastUpdate: row.tracking_last_update ?? undefined,
    trackingUrl: row.tracking_url ?? undefined,
    articleData: row.article_data ? JSON.parse(row.article_data) : undefined,
  };
}

// Prepared statements for performance
const statements = {
  getAll: db.prepare(`
    SELECT * FROM pins
    WHERE deleted_at IS NULL
    ORDER BY
      CASE status WHEN 'active' THEN 0 ELSE 1 END,
      COALESCE(priority, 3),
      created_at DESC
  `),
  getById: db.prepare('SELECT * FROM pins WHERE id = ? AND deleted_at IS NULL'),
  insert: db.prepare(`
    INSERT INTO pins (id, type, title, content, status, created_at, updated_at, url, due_at, priority, email_from, email_date, email_id, repo, stars, forks, idea_verdict, idea_scores, idea_competitors, idea_effort_estimate, idea_research_summary, tracking_number, tracking_carrier, tracking_status, tracking_location, tracking_eta, tracking_last_update, tracking_url, article_data)
    VALUES (@id, @type, @title, @content, @status, @created_at, @updated_at, @url, @due_at, @priority, @email_from, @email_date, @email_id, @repo, @stars, @forks, @idea_verdict, @idea_scores, @idea_competitors, @idea_effort_estimate, @idea_research_summary, @tracking_number, @tracking_carrier, @tracking_status, @tracking_location, @tracking_eta, @tracking_last_update, @tracking_url, @article_data)
  `),
  update: db.prepare(`
    UPDATE pins SET
      title = @title,
      content = @content,
      status = @status,
      updated_at = @updated_at,
      url = @url,
      due_at = @due_at,
      priority = @priority,
      email_from = @email_from,
      email_date = @email_date,
      email_id = @email_id,
      repo = @repo,
      stars = @stars,
      forks = @forks,
      idea_verdict = @idea_verdict,
      idea_scores = @idea_scores,
      idea_competitors = @idea_competitors,
      idea_effort_estimate = @idea_effort_estimate,
      idea_research_summary = @idea_research_summary,
      tracking_number = @tracking_number,
      tracking_carrier = @tracking_carrier,
      tracking_status = @tracking_status,
      tracking_location = @tracking_location,
      tracking_eta = @tracking_eta,
      tracking_last_update = @tracking_last_update,
      tracking_url = @tracking_url,
      article_data = @article_data
    WHERE id = @id
  `),
  softDelete: db.prepare('UPDATE pins SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL'),
};

export function getAllPins(): Pin[] {
  const rows = statements.getAll.all() as PinRow[];
  return rows.map(rowToPin);
}

export function getPin(id: string): Pin | undefined {
  const row = statements.getById.get(id) as PinRow | undefined;
  return row ? rowToPin(row) : undefined;
}

export function createPin(data: CreatePinRequest): Pin {
  const now = new Date().toISOString();
  const id = uuidv4();

  statements.insert.run({
    id,
    type: data.type,
    title: data.title,
    content: data.content ?? null,
    status: 'active',
    created_at: now,
    updated_at: now,
    url: data.url ?? null,
    due_at: data.dueAt ?? null,
    priority: data.priority ?? 2,
    email_from: data.emailFrom ?? null,
    email_date: data.emailDate ?? null,
    email_id: data.emailId ?? null,
    repo: data.repo ?? null,
    stars: data.stars ?? null,
    forks: data.forks ?? null,
    idea_verdict: data.ideaVerdict ?? null,
    idea_scores: data.ideaScores ? JSON.stringify(data.ideaScores) : null,
    idea_competitors: data.ideaCompetitors ?? null,
    idea_effort_estimate: data.ideaEffortEstimate ?? null,
    idea_research_summary: data.ideaResearchSummary ?? null,
    // Package tracking fields
    tracking_number: data.trackingNumber ?? null,
    tracking_carrier: data.trackingCarrier ?? null,
    tracking_status: data.trackingStatus ?? null,
    tracking_location: data.trackingLocation ?? null,
    tracking_eta: data.trackingEta ?? null,
    tracking_last_update: data.trackingLastUpdate ?? null,
    tracking_url: data.trackingUrl ?? null,
    article_data: data.articleData ? JSON.stringify(data.articleData) : null,
  });

  return getPin(id)!;
}

export function updatePin(id: string, data: UpdatePinRequest): Pin | null {
  const existing = getPin(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  statements.update.run({
    id,
    title: data.title ?? existing.title,
    content: data.content ?? existing.content ?? null,
    status: data.status ?? existing.status,
    updated_at: now,
    url: data.url ?? existing.url ?? null,
    due_at: data.dueAt ?? existing.dueAt ?? null,
    priority: data.priority ?? existing.priority ?? null,
    // Email fields
    email_from: data.emailFrom ?? existing.emailFrom ?? null,
    email_date: data.emailDate ?? existing.emailDate ?? null,
    email_id: data.emailId ?? existing.emailId ?? null,
    // GitHub fields
    repo: data.repo ?? existing.repo ?? null,
    stars: data.stars ?? existing.stars ?? null,
    forks: data.forks ?? existing.forks ?? null,
    // Idea fields
    idea_verdict: data.ideaVerdict ?? existing.ideaVerdict ?? null,
    idea_scores: data.ideaScores ? JSON.stringify(data.ideaScores) : existing.ideaScores ? JSON.stringify(existing.ideaScores) : null,
    idea_competitors: data.ideaCompetitors ?? existing.ideaCompetitors ?? null,
    idea_effort_estimate: data.ideaEffortEstimate ?? existing.ideaEffortEstimate ?? null,
    idea_research_summary: data.ideaResearchSummary ?? existing.ideaResearchSummary ?? null,
    // Tracking fields
    tracking_number: data.trackingNumber ?? existing.trackingNumber ?? null,
    tracking_carrier: data.trackingCarrier ?? existing.trackingCarrier ?? null,
    tracking_status: data.trackingStatus ?? existing.trackingStatus ?? null,
    tracking_location: data.trackingLocation ?? existing.trackingLocation ?? null,
    tracking_eta: data.trackingEta ?? existing.trackingEta ?? null,
    tracking_last_update: data.trackingLastUpdate ?? existing.trackingLastUpdate ?? null,
    tracking_url: data.trackingUrl ?? existing.trackingUrl ?? null,
    article_data: data.articleData ? JSON.stringify(data.articleData) : existing.articleData ? JSON.stringify(existing.articleData) : null,
  });

  return getPin(id)!;
}

export function deletePin(id: string): boolean {
  const now = new Date().toISOString();
  const result = statements.softDelete.run(now, id);
  return result.changes > 0;
}

export function completePin(id: string): Pin | null {
  return updatePin(id, { status: 'completed' });
}

export function dismissPin(id: string): Pin | null {
  return updatePin(id, { status: 'dismissed' });
}

// Restore a deleted pin
export function restorePin(id: string): Pin | null {
  const result = db.prepare('UPDATE pins SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL').run(new Date().toISOString(), id);
  if (result.changes === 0) return null;
  return getPin(id) ?? null;
}

// Get deleted pins for history view
export function getDeletedPins(): (Pin & { deletedAt: string })[] {
  const rows = db.prepare(`
    SELECT * FROM pins
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC
    LIMIT 50
  `).all() as (PinRow & { deleted_at: string })[];
  
  return rows.map(row => ({
    ...rowToPin(row),
    deletedAt: row.deleted_at,
  }));
}
