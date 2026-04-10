import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  CreatePinRequest,
  UpdatePinRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateTrackRequest,
} from '@corkboard/shared';
import * as pinStore from './pins.js';
import * as projectStore from './projects.js';
import { config } from './config.js';
import { requireToken, requireSocketToken } from './auth.js';
import {
  ValidationError,
  validateAddTrackRequest,
  validateCreatePinRequest,
  validateCreateProjectRequest,
  validateHoldProjectRequest,
  validateReorderTracksRequest,
  validateUpdatePinRequest,
  validateUpdateProjectRequest,
  validateUpdateTrackRequest,
} from './validation.js';

export const app = express();
export const httpServer = createServer(app);

const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => (req: Request, res: Response, next: NextFunction) => {
  void handler(req, res, next).catch(next);
};

function isSqliteConstraintError(error: unknown): error is Error {
  return error instanceof Error && error.name === 'SqliteError' && /constraint failed/i.test(error.message);
}

// Socket.io with typed events
export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Middleware
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// Auth — must be after body parsing and before any /api routes (including the
// lamp routes registered later in this file). Static files stay unauthenticated
// so the HTML shell and client bundle can load before the browser authenticates.
app.use('/api', requireToken);
io.use(requireSocketToken);

// REST API Routes

// Get all pins
app.get('/api/pins', (_req, res) => {
  const pins = pinStore.getAllPins();
  res.json(pins);
});

// Get single pin
app.get('/api/pins/:id', (req, res) => {
  const pin = pinStore.getPin(req.params.id);
  if (!pin) {
    return res.status(404).json({ error: 'Pin not found' });
  }
  res.json(pin);
});

// Create pin
app.post('/api/pins', (req, res) => {
  const data: CreatePinRequest = validateCreatePinRequest(req.body);

  const pin = pinStore.createPin(data);

  // Broadcast to all connected clients
  io.emit('pin:created', pin);

  res.status(201).json(pin);
});

// Update pin
app.patch('/api/pins/:id', (req, res) => {
  const data: UpdatePinRequest = validateUpdatePinRequest(req.body);
  const pin = pinStore.updatePin(req.params.id, data);

  if (!pin) {
    return res.status(404).json({ error: 'Pin not found' });
  }

  // Broadcast update
  io.emit('pin:updated', pin);

  res.json(pin);
});

// Delete pin
app.delete('/api/pins/:id', (req, res) => {
  const deleted = pinStore.deletePin(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: 'Pin not found' });
  }

  // Broadcast deletion
  io.emit('pin:deleted', req.params.id);

  res.status(204).send();
});

// Get deleted pins history
app.get('/api/pins/history/deleted', (_req, res) => {
  const deletedPins = pinStore.getDeletedPins();
  res.json(deletedPins);
});

// Restore a deleted pin
app.post('/api/pins/:id/restore', (req, res) => {
  const pin = pinStore.restorePin(req.params.id);

  if (!pin) {
    return res.status(404).json({ error: 'Pin not found or not deleted' });
  }

  // Broadcast restoration as a new pin
  io.emit('pin:created', pin);

  res.json(pin);
});

// ─── Project Pipeline Routes ─────────────────────────────

// Get all projects
app.get('/api/projects', (_req, res) => {
  res.json(projectStore.getProjects());
});

// Get single project
app.get('/api/projects/:id', (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// Create project
app.post('/api/projects', (req, res) => {
  const data: CreateProjectRequest = validateCreateProjectRequest(req.body);
  const project = projectStore.createProject(data);
  io.emit('project:created', project);
  res.status(201).json(project);
});

// Update project metadata
app.patch('/api/projects/:id', (req, res) => {
  const data: UpdateProjectRequest = validateUpdateProjectRequest(req.body);
  const project = projectStore.updateProject(req.params.id, data);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  io.emit('project:updated', project);
  res.json(project);
});

// Soft delete project
app.delete('/api/projects/:id', (req, res) => {
  const deleted = projectStore.deleteProject(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Project not found' });
  io.emit('project:deleted', { id: req.params.id });
  res.status(204).send();
});

// Restore deleted project
app.post('/api/projects/:id/restore', (req, res) => {
  const project = projectStore.restoreProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found or not deleted' });
  io.emit('project:created', project);
  res.json(project);
});

// Put project on hold
app.post('/api/projects/:id/hold', (req, res) => {
  const { reason } = validateHoldProjectRequest(req.body);
  const project = projectStore.holdProject(req.params.id, reason);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  io.emit('project:updated', project);
  res.json(project);
});

// Resume project from hold/archived
app.post('/api/projects/:id/resume', (req, res) => {
  const project = projectStore.resumeProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  io.emit('project:updated', project);
  res.json(project);
});

// Archive project
app.post('/api/projects/:id/archive', (req, res) => {
  const project = projectStore.archiveProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  io.emit('project:updated', project);
  res.json(project);
});

// Send project to cellar
app.post('/api/projects/:id/cellar', (req, res) => {
  const project = projectStore.cellarProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  io.emit('project:updated', project);
  res.json(project);
});

// Add track to project
app.post('/api/projects/:id/tracks', (req, res) => {
  const data = validateAddTrackRequest(req.body);
  const project = projectStore.addTrack(req.params.id, data);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  io.emit('project:updated', project);
  res.status(201).json(project);
});

// Update track
app.patch('/api/projects/:id/tracks/:trackId', (req, res) => {
  const data: UpdateTrackRequest = validateUpdateTrackRequest(req.body);
  const result = projectStore.updateTrack(req.params.id, req.params.trackId, data);
  if (!result) return res.status(404).json({ error: 'Track not found' });
  io.emit('project:updated', result.project);
  if (result.autoPin) io.emit('pin:created', result.autoPin);
  res.json(result.project);
});

// Delete track
app.delete('/api/projects/:id/tracks/:trackId', (req, res) => {
  const project = projectStore.deleteTrack(req.params.id, req.params.trackId);
  if (!project) return res.status(404).json({ error: 'Track not found' });
  io.emit('project:updated', project);
  res.json(project);
});

// Reorder tracks (declared before toggle route as a clarity convention)
app.post('/api/projects/:id/tracks/reorder', (req, res) => {
  const { order } = validateReorderTracksRequest(req.body);
  const project = projectStore.reorderTracks(req.params.id, order);
  if (!project) return res.status(400).json({ error: 'Project not found or order mismatch' });
  io.emit('project:updated', project);
  res.json(project);
});

// Toggle task on a track
app.post('/api/projects/:id/tracks/:trackId/tasks/:taskId/toggle', (req, res) => {
  const result = projectStore.toggleTask(req.params.id, req.params.trackId, req.params.taskId);
  if (!result) return res.status(404).json({ error: 'Task not found' });
  io.emit('project:updated', result.project);
  if (result.autoPin) io.emit('pin:created', result.autoPin);
  res.json(result.project);
});

// Serve static frontend files (production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientDist = join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// Lamp control — uses Home Assistant (HA_URL + HA_TOKEN) or external lamp server (LAMP_SERVER)
import { getLampStatus, setLampState, type LampState } from './lamp.js';

app.get('/api/lamp/status', asyncHandler(async (_req, res) => {
  if (config.ha.url) {
    const status = await getLampStatus();
    return res.json(status);
  }
  if (!config.lampServer) {
    return res.status(503).json({ status: 'disabled', message: 'Lamp not configured. Set HA_URL+HA_TOKEN or LAMP_SERVER.' });
  }
  try {
    const response = await fetch(`${config.lampServer}/lamp/status`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(503).json({ status: 'error', message: 'Lamp server unavailable' });
  }
}));

app.post('/api/lamp/:state', asyncHandler(async (req, res) => {
  const { state } = req.params;
  if (!['waiting', 'idle', 'attention', 'urgent', 'success', 'off'].includes(state)) {
    return res.status(400).json({ status: 'error', message: 'Invalid state' });
  }
  if (config.ha.url) {
    const result = await setLampState(state as LampState);
    return result.success
      ? res.json(result)
      : res.status(503).json({ ...result, message: 'Failed to reach Home Assistant' });
  }
  if (!config.lampServer) {
    return res.status(503).json({ status: 'disabled', message: 'Lamp not configured. Set HA_URL+HA_TOKEN or LAMP_SERVER.' });
  }
  try {
    const response = await fetch(`${config.lampServer}/lamp/${state}`, { method: 'POST' });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(503).json({ status: 'error', message: 'Lamp server unavailable' });
  }
}));

// SPA catch-all - serve index.html for any non-API routes
app.get('*', (_req, res) => {
  res.sendFile(join(clientDist, 'index.html'));
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (isSqliteConstraintError(error)) {
    console.error('Database constraint error:', error.message);
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

// WebSocket handlers
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current pins on connect
  socket.emit('pins:sync', pinStore.getAllPins());

  // Handle completion from client
  socket.on('pin:complete', (id) => {
    const pin = pinStore.completePin(id);
    if (pin) {
      io.emit('pin:updated', pin);
    }
  });

  // Handle dismissal from client
  socket.on('pin:dismiss', (id) => {
    const pin = pinStore.dismissPin(id);
    if (pin) {
      io.emit('pin:updated', pin);
    }
  });

  // Handle sync request
  socket.on('pins:request', () => {
    socket.emit('pins:sync', pinStore.getAllPins());
  });

  // Send current projects on connect
  socket.emit('projects:sync', projectStore.getProjects());

  // Handle project sync request
  socket.on('projects:request', () => {
    socket.emit('projects:sync', projectStore.getProjects());
  });

  // Handle task toggle from client
  socket.on('project:task:toggle', ({ projectId, trackId, taskId }) => {
    const result = projectStore.toggleTask(projectId, trackId, taskId);
    if (result) {
      io.emit('project:updated', result.project);
      if (result.autoPin) io.emit('pin:created', result.autoPin);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});
