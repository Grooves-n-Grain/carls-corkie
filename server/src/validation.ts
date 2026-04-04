import type {
  CreatePinRequest,
  UpdatePinRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateTrackRequest,
  ProjectTask,
  TrackAttachment,
  TrackOwner,
} from '@corkboard/shared';

type JsonObject = Record<string, unknown>;

const PIN_TYPES = [
  'task',
  'note',
  'link',
  'event',
  'alert',
  'email',
  'opportunity',
  'briefing',
  'github',
  'idea',
  'tracking',
  'article',
  'twitter',
  'reddit',
] as const;

const PIN_STATUSES = ['active', 'completed', 'snoozed', 'dismissed'] as const;
const IDEA_VERDICTS = ['hot', 'warm', 'cold', 'pass'] as const;
const TRACKING_STATUSES = ['pre-transit', 'in-transit', 'out-for-delivery', 'delivered', 'exception', 'unknown'] as const;
const PROJECT_PHASES = ['concept', 'build', 'polish', 'publish', 'shipped'] as const;
const PROJECT_STATUSES = ['active', 'on-hold', 'archived', 'cellar'] as const;
const TRACK_OWNERS = ['claude', 'you', 'shared'] as const;
const TRACK_STATUSES = ['active', 'waiting', 'done', 'locked'] as const;
const ATTACHMENT_TYPES = ['code', 'image', 'file', 'link'] as const;

export class ValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expectObject(value: unknown, name: string): JsonObject {
  if (!isPlainObject(value)) {
    throw new ValidationError(`${name} must be an object`);
  }
  return value;
}

function expectNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  return expectString(value, field);
}

function optionalDateString(value: unknown, field: string): string | undefined {
  const parsed = optionalString(value, field);
  if (parsed === undefined) return undefined;
  if (Number.isNaN(Date.parse(parsed))) {
    throw new ValidationError(`${field} must be a valid date string`);
  }
  return parsed;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function optionalHttpUrl(value: unknown, field: string): string | undefined {
  const parsed = optionalString(value, field);
  if (parsed === undefined) return undefined;
  if (!isHttpUrl(parsed)) {
    throw new ValidationError(`${field} must be an absolute http(s) URL`);
  }
  return parsed;
}

function optionalIntegerInRange(value: unknown, field: string, min: number, max: number): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new ValidationError(`${field} must be an integer between ${min} and ${max}`);
  }
  return value as number;
}

function optionalNonNegativeInteger(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new ValidationError(`${field} must be a non-negative integer`);
  }
  return value as number;
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${field} must be a boolean`);
  }
  return value;
}

function optionalEnum<T extends readonly string[]>(value: unknown, field: string, allowed: T): T[number] | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return value as T[number];
}

function validateIdeaScores(value: unknown): CreatePinRequest['ideaScores'] | undefined {
  if (value === undefined) return undefined;

  const object = expectObject(value, 'ideaScores');
  const result: NonNullable<CreatePinRequest['ideaScores']> = {};
  const scoreFields = ['viability', 'alignment', 'effort', 'competition', 'marketSignal'] as const;

  for (const field of scoreFields) {
    const score = object[field];
    if (score === undefined) continue;
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 10) {
      throw new ValidationError(`ideaScores.${field} must be a number between 0 and 10`);
    }
    result[field] = score;
  }

  return result;
}

function validateArticleData(value: unknown): CreatePinRequest['articleData'] | undefined {
  if (value === undefined) return undefined;

  const object = expectObject(value, 'articleData');
  const bullets = object.bullets;
  const tags = object.tags;

  if (!Array.isArray(bullets) || bullets.some((bullet) => typeof bullet !== 'string')) {
    throw new ValidationError('articleData.bullets must be an array of strings');
  }

  if (tags !== undefined && (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string'))) {
    throw new ValidationError('articleData.tags must be an array of strings');
  }

  return {
    url: expectHttpUrl(object.url, 'articleData.url'),
    source: expectNonEmptyString(object.source, 'articleData.source'),
    readTime: optionalString(object.readTime, 'articleData.readTime'),
    tldr: expectNonEmptyString(object.tldr, 'articleData.tldr'),
    bullets,
    tags: tags as string[] | undefined,
  };
}

function expectHttpUrl(value: unknown, field: string): string {
  const parsed = expectString(value, field);
  if (!isHttpUrl(parsed)) {
    throw new ValidationError(`${field} must be an absolute http(s) URL`);
  }
  return parsed;
}

function validateTrackTasks(value: unknown): ProjectTask[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new ValidationError('tasks must be an array');
  }

  return value.map((task, index) => {
    const object = expectObject(task, `tasks[${index}]`);
    return {
      id: expectNonEmptyString(object.id, `tasks[${index}].id`),
      text: expectNonEmptyString(object.text, `tasks[${index}].text`),
      done: expectBoolean(object.done, `tasks[${index}].done`),
    };
  });
}

function validateTrackAttachment(value: unknown): TrackAttachment | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const object = expectObject(value, 'attachment');
  return {
    type: expectEnum(object.type, 'attachment.type', ATTACHMENT_TYPES),
    label: expectNonEmptyString(object.label, 'attachment.label'),
    note: expectString(object.note, 'attachment.note'),
    url: optionalHttpUrl(object.url, 'attachment.url'),
  };
}

function validateTrackDraft(value: unknown, field: string): { name: string; owner: TrackOwner } {
  const object = expectObject(value, field);
  return {
    name: expectNonEmptyString(object.name, `${field}.name`),
    owner: expectEnum(object.owner, `${field}.owner`, TRACK_OWNERS),
  };
}

function expectBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${field} must be a boolean`);
  }
  return value;
}

function expectEnum<T extends readonly string[]>(value: unknown, field: string, allowed: T): T[number] {
  const parsed = optionalEnum(value, field, allowed);
  if (parsed === undefined) {
    throw new ValidationError(`${field} is required`);
  }
  return parsed;
}

function validatePinBody(input: unknown, { partial }: { partial: boolean }): CreatePinRequest | UpdatePinRequest {
  const body = expectObject(input, 'request body');

  const type = partial ? optionalEnum(body.type, 'type', PIN_TYPES) : expectEnum(body.type, 'type', PIN_TYPES);
  const title = partial
    ? (body.title !== undefined ? expectNonEmptyString(body.title, 'title') : undefined)
    : expectNonEmptyString(body.title, 'title');

  return {
    ...(type !== undefined ? { type } : {}),
    ...(title !== undefined ? { title: partial ? title : title.trim() } : {}),
    ...(body.content !== undefined ? { content: expectString(body.content, 'content') } : {}),
    ...(body.status !== undefined ? { status: expectEnum(body.status, 'status', PIN_STATUSES) } : {}),
    ...(body.url !== undefined ? { url: expectHttpUrl(body.url, 'url') } : {}),
    ...(body.dueAt !== undefined ? { dueAt: optionalDateString(body.dueAt, 'dueAt') } : {}),
    ...(body.priority !== undefined ? { priority: optionalIntegerInRange(body.priority, 'priority', 1, 3) } : {}),
    ...(body.emailFrom !== undefined ? { emailFrom: expectString(body.emailFrom, 'emailFrom') } : {}),
    ...(body.emailDate !== undefined ? { emailDate: optionalDateString(body.emailDate, 'emailDate') } : {}),
    ...(body.emailId !== undefined ? { emailId: expectString(body.emailId, 'emailId') } : {}),
    ...(body.repo !== undefined ? { repo: expectString(body.repo, 'repo') } : {}),
    ...(body.stars !== undefined ? { stars: optionalNonNegativeInteger(body.stars, 'stars') } : {}),
    ...(body.forks !== undefined ? { forks: optionalNonNegativeInteger(body.forks, 'forks') } : {}),
    ...(body.ideaVerdict !== undefined ? { ideaVerdict: expectEnum(body.ideaVerdict, 'ideaVerdict', IDEA_VERDICTS) } : {}),
    ...(body.ideaScores !== undefined ? { ideaScores: validateIdeaScores(body.ideaScores) } : {}),
    ...(body.ideaCompetitors !== undefined ? { ideaCompetitors: optionalNonNegativeInteger(body.ideaCompetitors, 'ideaCompetitors') } : {}),
    ...(body.ideaEffortEstimate !== undefined ? { ideaEffortEstimate: expectString(body.ideaEffortEstimate, 'ideaEffortEstimate') } : {}),
    ...(body.ideaResearchSummary !== undefined ? { ideaResearchSummary: expectString(body.ideaResearchSummary, 'ideaResearchSummary') } : {}),
    ...(body.trackingNumber !== undefined ? { trackingNumber: expectString(body.trackingNumber, 'trackingNumber') } : {}),
    ...(body.trackingCarrier !== undefined ? { trackingCarrier: expectString(body.trackingCarrier, 'trackingCarrier') } : {}),
    ...(body.trackingStatus !== undefined ? { trackingStatus: expectEnum(body.trackingStatus, 'trackingStatus', TRACKING_STATUSES) } : {}),
    ...(body.trackingLocation !== undefined ? { trackingLocation: expectString(body.trackingLocation, 'trackingLocation') } : {}),
    ...(body.trackingEta !== undefined ? { trackingEta: optionalDateString(body.trackingEta, 'trackingEta') } : {}),
    ...(body.trackingLastUpdate !== undefined ? { trackingLastUpdate: optionalDateString(body.trackingLastUpdate, 'trackingLastUpdate') } : {}),
    ...(body.trackingUrl !== undefined ? { trackingUrl: expectHttpUrl(body.trackingUrl, 'trackingUrl') } : {}),
    ...(body.articleData !== undefined ? { articleData: validateArticleData(body.articleData) } : {}),
  };
}

export function validateCreatePinRequest(input: unknown): CreatePinRequest {
  return validatePinBody(input, { partial: false }) as CreatePinRequest;
}

export function validateUpdatePinRequest(input: unknown): UpdatePinRequest {
  return validatePinBody(input, { partial: true }) as UpdatePinRequest;
}

export function validateCreateProjectRequest(input: unknown): CreateProjectRequest {
  const body = expectObject(input, 'request body');
  const tracks = body.tracks;

  if (tracks !== undefined && !Array.isArray(tracks)) {
    throw new ValidationError('tracks must be an array');
  }

  return {
    name: expectNonEmptyString(body.name, 'name'),
    ...(body.emoji !== undefined ? { emoji: expectString(body.emoji, 'emoji') } : {}),
    ...(body.color !== undefined ? { color: expectString(body.color, 'color') } : {}),
    ...(body.phase !== undefined ? { phase: expectEnum(body.phase, 'phase', PROJECT_PHASES) } : {}),
    ...(tracks !== undefined
      ? { tracks: tracks.map((track, index) => validateTrackDraft(track, `tracks[${index}]`)) }
      : {}),
    ...(body.initialStatus !== undefined
      ? { initialStatus: expectEnum(body.initialStatus, 'initialStatus', PROJECT_STATUSES) }
      : {}),
  };
}

export function validateUpdateProjectRequest(input: unknown): UpdateProjectRequest {
  const body = expectObject(input, 'request body');

  return {
    ...(body.name !== undefined ? { name: expectNonEmptyString(body.name, 'name') } : {}),
    ...(body.emoji !== undefined ? { emoji: expectString(body.emoji, 'emoji') } : {}),
    ...(body.color !== undefined ? { color: expectString(body.color, 'color') } : {}),
    ...(body.phase !== undefined ? { phase: expectEnum(body.phase, 'phase', PROJECT_PHASES) } : {}),
  };
}

export function validateHoldProjectRequest(input: unknown): { reason: string } {
  const body = expectObject(input, 'request body');
  return {
    reason: expectNonEmptyString(body.reason, 'reason'),
  };
}

export function validateAddTrackRequest(input: unknown): { name: string; owner: TrackOwner } {
  return validateTrackDraft(input, 'track');
}

export function validateUpdateTrackRequest(input: unknown): UpdateTrackRequest {
  const body = expectObject(input, 'request body');

  return {
    ...(body.name !== undefined ? { name: expectNonEmptyString(body.name, 'name') } : {}),
    ...(body.owner !== undefined ? { owner: expectEnum(body.owner, 'owner', TRACK_OWNERS) } : {}),
    ...(body.status !== undefined ? { status: expectEnum(body.status, 'status', TRACK_STATUSES) } : {}),
    ...(body.tasks !== undefined ? { tasks: validateTrackTasks(body.tasks) } : {}),
    ...(body.attachment !== undefined ? { attachment: validateTrackAttachment(body.attachment) } : {}),
  };
}

export function validateReorderTracksRequest(input: unknown): { order: string[] } {
  const body = expectObject(input, 'request body');
  const order = body.order;

  if (!Array.isArray(order) || order.some((id) => typeof id !== 'string' || id.trim() === '')) {
    throw new ValidationError('order must be an array of non-empty strings');
  }

  return { order };
}
