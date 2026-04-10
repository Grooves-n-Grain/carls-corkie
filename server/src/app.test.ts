import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import db from './db.js';

const TEST_TOKEN = process.env.CORKBOARD_TOKEN!;
const api = request.agent(app).set('Authorization', `Bearer ${TEST_TOKEN}`);

describe('Corkboard API', () => {
  let createdPinId: string;
  let createdProjectIds: string[] = [];

  afterEach(async () => {
    // Clean up: delete pin if it was created
    if (createdPinId) {
      await api.delete(`/api/pins/${createdPinId}`);
      createdPinId = '';
    }

    for (const projectId of createdProjectIds) {
      await api.delete(`/api/projects/${projectId}`);
    }
    createdProjectIds = [];
  });

  describe('GET /api/pins', () => {
    it('should return an array of pins', async () => {
      const res = await api.get('/api/pins');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/pins', () => {
    it('should create a new pin', async () => {
      const newPin = {
        type: 'task',
        title: 'Test Task',
        content: 'Test content',
        priority: 2
      };

      const res = await api
        .post('/api/pins')
        .send(newPin);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Test Task');
      expect(res.body.type).toBe('task');
      expect(res.body.status).toBe('active');

      createdPinId = res.body.id;
    });

    it('should return 400 if type is missing', async () => {
      const res = await api
        .post('/api/pins')
        .send({ title: 'Missing type' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('type is required');
    });

    it('should return 400 if title is missing', async () => {
      const res = await api
        .post('/api/pins')
        .send({ type: 'task' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('title must be a non-empty string');
    });

    it('should return 400 for an invalid priority', async () => {
      const res = await api
        .post('/api/pins')
        .send({ type: 'task', title: 'Invalid priority', priority: 99 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('priority must be an integer between 1 and 3');
    });
  });

  describe('GET /api/pins/:id', () => {
    it('should return a specific pin', async () => {
      // First create a pin
      const createRes = await api
        .post('/api/pins')
        .send({ type: 'note', title: 'Test Note' });

      createdPinId = createRes.body.id;

      // Then fetch it
      const res = await api.get(`/api/pins/${createdPinId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdPinId);
      expect(res.body.title).toBe('Test Note');
    });

    it('should return 404 for non-existent pin', async () => {
      const res = await api.get('/api/pins/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Pin not found');
    });
  });

  describe('PATCH /api/pins/:id', () => {
    it('should update a pin', async () => {
      // First create a pin
      const createRes = await api
        .post('/api/pins')
        .send({ type: 'task', title: 'Original Title' });

      createdPinId = createRes.body.id;

      // Update it
      const res = await api
        .patch(`/api/pins/${createdPinId}`)
        .send({ title: 'Updated Title', status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.status).toBe('completed');
    });

    it('should return 404 for non-existent pin', async () => {
      const res = await api
        .patch('/api/pins/non-existent-id')
        .send({ title: 'Update' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Pin not found');
    });
  });

  describe('DELETE /api/pins/:id', () => {
    it('should delete a pin', async () => {
      // First create a pin
      const createRes = await api
        .post('/api/pins')
        .send({ type: 'alert', title: 'To Delete' });

      const pinId = createRes.body.id;

      // Delete it
      const res = await api.delete(`/api/pins/${pinId}`);

      expect(res.status).toBe(204);

      // Verify it's deleted
      const getRes = await api.get(`/api/pins/${pinId}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent pin', async () => {
      const res = await api.delete('/api/pins/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Pin not found');
    });
  });

  describe('GET /api/pins/history/deleted', () => {
    it('should return deleted pins', async () => {
      const res = await api.get('/api/pins/history/deleted');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/pins/:id/restore', () => {
    it('should restore a deleted pin', async () => {
      // Create a pin
      const createRes = await api
        .post('/api/pins')
        .send({ type: 'task', title: 'To Restore' });

      const pinId = createRes.body.id;

      // Delete it
      await api.delete(`/api/pins/${pinId}`);

      // Restore it
      const restoreRes = await api
        .post(`/api/pins/${pinId}/restore`);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.id).toBe(pinId);
      expect(restoreRes.body.title).toBe('To Restore');

      // Clean up
      createdPinId = pinId;
    });

    it('should return 404 for non-existent pin', async () => {
      const res = await api
        .post('/api/pins/non-existent-id/restore');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Pin not found or not deleted');
    });
  });

  describe('YouTube pins', () => {
    it('accepts a valid youtube pin payload', async () => {
      const payload = {
        type: 'youtube',
        title: 'Demo video',
        url: 'https://www.youtube.com/watch?v=abc123xyz00',
        youtubeData: {
          videoId: 'abc123xyz00',
          thumbnailUrl: 'https://i.ytimg.com/vi/abc123xyz00/hqdefault.jpg',
          channelTitle: 'Demo Channel',
          description: 'A demo description',
          publishedAt: '2026-04-09T12:00:00Z',
          duration: '12:44',
          embedUrl: 'https://www.youtube.com/embed/abc123xyz00',
          sourceUrl: 'https://www.youtube.com/watch?v=abc123xyz00',
        },
      };

      const res = await api.post('/api/pins').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('youtube');
      expect(res.body.youtubeData.videoId).toBe('abc123xyz00');
      expect(res.body.youtubeData.thumbnailUrl).toBe('https://i.ytimg.com/vi/abc123xyz00/hqdefault.jpg');
      expect(res.body.youtubeData.channelTitle).toBe('Demo Channel');
      expect(res.body.youtubeData.duration).toBe('12:44');

      createdPinId = res.body.id;
    });

    it('rejects youtube pin missing youtubeData.videoId', async () => {
      const res = await api.post('/api/pins').send({
        type: 'youtube',
        title: 'Missing videoId',
        url: 'https://www.youtube.com/watch?v=abc123xyz00',
        youtubeData: {
          thumbnailUrl: 'https://i.ytimg.com/vi/abc123xyz00/hqdefault.jpg',
        },
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('youtubeData.videoId');
    });

    it('rejects youtube pin missing youtubeData.thumbnailUrl', async () => {
      const res = await api.post('/api/pins').send({
        type: 'youtube',
        title: 'Missing thumbnail',
        url: 'https://www.youtube.com/watch?v=abc123xyz00',
        youtubeData: {
          videoId: 'abc123xyz00',
        },
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('youtubeData.thumbnailUrl');
    });

    it('rejects youtube pin with bad embedUrl', async () => {
      const res = await api.post('/api/pins').send({
        type: 'youtube',
        title: 'Bad embedUrl',
        url: 'https://www.youtube.com/watch?v=abc123xyz00',
        youtubeData: {
          videoId: 'abc123xyz00',
          thumbnailUrl: 'https://i.ytimg.com/vi/abc123xyz00/hqdefault.jpg',
          embedUrl: 'not-a-url',
        },
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('youtubeData.embedUrl');
    });

    it('round-trips youtubeData through create and fetch', async () => {
      const payload = {
        type: 'youtube',
        title: 'Roundtrip test',
        url: 'https://www.youtube.com/watch?v=roundtrip11',
        youtubeData: {
          videoId: 'roundtrip11',
          thumbnailUrl: 'https://i.ytimg.com/vi/roundtrip11/hqdefault.jpg',
          channelTitle: 'Test Channel',
          embedUrl: 'https://www.youtube.com/embed/roundtrip11',
          sourceUrl: 'https://www.youtube.com/watch?v=roundtrip11',
        },
      };

      const createRes = await api.post('/api/pins').send(payload);
      expect(createRes.status).toBe(201);
      createdPinId = createRes.body.id;

      const getRes = await api.get('/api/pins');
      expect(getRes.status).toBe(200);

      const pin = getRes.body.find((p: { id: string }) => p.id === createdPinId);
      expect(pin).toBeDefined();
      expect(pin.youtubeData).toBeDefined();
      expect(pin.youtubeData.videoId).toBe('roundtrip11');
      expect(pin.youtubeData.channelTitle).toBe('Test Channel');
    });
  });

  describe('POST /api/projects', () => {
    it('should return 400 for an invalid track owner', async () => {
      const res = await api
        .post('/api/projects')
        .send({
          name: 'Project with bad track owner',
          tracks: [{ name: 'Research', owner: 'invalid-owner' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('tracks[0].owner must be one of: claude, you, shared');
    });

    it('backfills missing legacy task ids so each checkbox toggles independently', async () => {
      const createRes = await api
        .post('/api/projects')
        .send({
          name: 'Legacy Task Project',
          tracks: [{ name: 'Distribution', owner: 'you' }],
        });

      expect(createRes.status).toBe(201);

      const projectId = createRes.body.id as string;
      const trackId = createRes.body.tracks[0].id as string;
      createdProjectIds.push(projectId);

      db.prepare('UPDATE project_tracks SET tasks = ? WHERE id = ?').run(
        JSON.stringify([
          { text: 'First legacy task', done: false },
          { text: 'Second legacy task', done: false },
        ]),
        trackId,
      );

      const getRes = await api.get(`/api/projects/${projectId}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.tracks[0].tasks).toHaveLength(2);
      expect(getRes.body.tracks[0].tasks[0].id).toBeTruthy();
      expect(getRes.body.tracks[0].tasks[1].id).toBeTruthy();
      expect(getRes.body.tracks[0].tasks[0].id).not.toBe(getRes.body.tracks[0].tasks[1].id);

      const secondTaskId = getRes.body.tracks[0].tasks[1].id as string;

      const toggleRes = await api
        .post(`/api/projects/${projectId}/tracks/${trackId}/tasks/${secondTaskId}/toggle`);

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.tracks[0].tasks[0].done).toBe(false);
      expect(toggleRes.body.tracks[0].tasks[1].done).toBe(true);
    });
  });

  describe('POST /api/projects/:id/cellar', () => {
    it('moves a project to cellar status', async () => {
      const createRes = await api
        .post('/api/projects')
        .send({ name: 'Future Idea' });
      expect(createRes.status).toBe(201);
      const projectId = createRes.body.id as string;
      createdProjectIds.push(projectId);

      const res = await api.post(`/api/projects/${projectId}/cellar`);
      expect(res.status).toBe(200);
      expect(res.body.projectStatus).toBe('cellar');
    });

    it('returns 404 for non-existent project', async () => {
      const res = await api.post('/api/projects/does-not-exist/cellar');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Project not found');
    });
  });
});
