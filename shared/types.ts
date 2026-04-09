// Pin types for the corkboard dashboard

export type PinType = 'task' | 'note' | 'link' | 'event' | 'alert' | 'email' | 'opportunity' | 'briefing' | 'github' | 'idea' | 'tracking' | 'article' | 'twitter' | 'reddit' | 'youtube';

export type PinStatus = 'active' | 'completed' | 'snoozed' | 'dismissed';

export interface ArticleData {
  url: string;
  source: string;
  readTime?: string;
  tldr: string;
  bullets: string[];
  tags?: string[];
}

export interface YouTubeData {
  videoId: string;
  channelTitle?: string;
  description?: string;
  thumbnailUrl: string;
  publishedAt?: string;
  duration?: string;
  embedUrl?: string;
  sourceUrl?: string;
}

export interface Pin {
  id: string;
  type: PinType;
  title: string;
  content?: string;
  status: PinStatus;
  createdAt: string;
  updatedAt: string;
  url?: string;
  dueAt?: string;
  priority?: number;
  emailFrom?: string;
  emailDate?: string;
  emailId?: string;
  repo?: string;
  stars?: number;
  forks?: number;
  ideaVerdict?: 'hot' | 'warm' | 'cold' | 'pass';
  ideaScores?: {
    viability?: number;
    alignment?: number;
    effort?: number;
    competition?: number;
    marketSignal?: number;
  };
  ideaCompetitors?: number;
  ideaEffortEstimate?: string;
  ideaResearchSummary?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingStatus?: 'pre-transit' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'exception' | 'unknown';
  trackingLocation?: string;
  trackingEta?: string;
  trackingLastUpdate?: string;
  trackingUrl?: string;
  articleData?: ArticleData;
  youtubeData?: YouTubeData;
}

export interface CreatePinRequest {
  type: PinType;
  title: string;
  content?: string;
  url?: string;
  dueAt?: string;
  priority?: number;
  emailFrom?: string;
  emailDate?: string;
  emailId?: string;
  repo?: string;
  stars?: number;
  forks?: number;
  ideaVerdict?: 'hot' | 'warm' | 'cold' | 'pass';
  ideaScores?: {
    viability?: number;
    alignment?: number;
    effort?: number;
    competition?: number;
    marketSignal?: number;
  };
  ideaCompetitors?: number;
  ideaEffortEstimate?: string;
  ideaResearchSummary?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingStatus?: 'pre-transit' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'exception' | 'unknown';
  trackingLocation?: string;
  trackingEta?: string;
  trackingLastUpdate?: string;
  trackingUrl?: string;
  articleData?: ArticleData;
  youtubeData?: YouTubeData;
}

export interface UpdatePinRequest {
  title?: string;
  content?: string;
  status?: PinStatus;
  url?: string;
  dueAt?: string;
  priority?: number;
  emailFrom?: string;
  emailDate?: string;
  emailId?: string;
  repo?: string;
  stars?: number;
  forks?: number;
  ideaVerdict?: 'hot' | 'warm' | 'cold' | 'pass';
  ideaScores?: {
    viability?: number;
    alignment?: number;
    effort?: number;
    competition?: number;
    marketSignal?: number;
  };
  ideaCompetitors?: number;
  ideaEffortEstimate?: string;
  ideaResearchSummary?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingStatus?: 'pre-transit' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'exception' | 'unknown';
  trackingLocation?: string;
  trackingEta?: string;
  trackingLastUpdate?: string;
  trackingUrl?: string;
  articleData?: ArticleData;
  youtubeData?: YouTubeData;
}

export interface ServerToClientEvents {
  'pin:created': (pin: Pin) => void;
  'pin:updated': (pin: Pin) => void;
  'pin:deleted': (id: string) => void;
  'pins:sync': (pins: Pin[]) => void;
  'project:created': (project: Project) => void;
  'project:updated': (project: Project) => void;
  'project:deleted': (data: { id: string }) => void;
  'projects:sync': (projects: Project[]) => void;
}

export interface ClientToServerEvents {
  'pin:complete': (id: string) => void;
  'pin:dismiss': (id: string) => void;
  'pins:request': () => void;
  'projects:request': () => void;
  'project:task:toggle': (data: { projectId: string; trackId: string; taskId: string }) => void;
}

// ─── Project Pipeline Types ──────────────────────────────

export type ProjectPhase = 'concept' | 'build' | 'polish' | 'publish' | 'shipped';
export type ProjectStatus = 'active' | 'on-hold' | 'archived' | 'cellar';
export type MenuAction = 'hold' | 'resume' | 'archive' | 'delete' | 'cellar';
export type TrackOwner = 'claude' | 'you' | 'shared';
export type TrackStatus = 'active' | 'waiting' | 'done' | 'locked';

export interface ProjectTask {
  id: string;
  text: string;
  done: boolean;
}

export interface TrackAttachment {
  type: 'code' | 'image' | 'file' | 'link';
  label: string;
  note: string;
  url?: string;
}

export interface ProjectTrack {
  id: string;
  name: string;
  owner: TrackOwner;
  status: TrackStatus;
  tasks: ProjectTask[];
  attachment: TrackAttachment | null;
  sortOrder: number;
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  phase: ProjectPhase;
  projectStatus: ProjectStatus;
  holdReason: string;
  createdAt: string;
  updatedAt: string;
  tracks: ProjectTrack[];
}

export interface CreateProjectRequest {
  name: string;
  emoji?: string;
  color?: string;
  phase?: ProjectPhase;
  tracks?: Array<{ name: string; owner: TrackOwner }>;
  initialStatus?: ProjectStatus;
}

export interface UpdateProjectRequest {
  name?: string;
  emoji?: string;
  color?: string;
  phase?: ProjectPhase;
}

export interface UpdateTrackRequest {
  name?: string;
  owner?: TrackOwner;
  status?: TrackStatus;
  tasks?: ProjectTask[];
  attachment?: TrackAttachment | null;
}
