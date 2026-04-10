import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

const TEST_TOKEN = process.env.CORKBOARD_TOKEN!;

describe('REST auth middleware', () => {
  describe('when CORKBOARD_TOKEN is set (default test setup)', () => {
    it('rejects requests with no Authorization header (401)', async () => {
      const res = await request(app).get('/api/pins');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/missing or invalid token/i);
    });

    it('rejects requests with the wrong token (401)', async () => {
      const res = await request(app)
        .get('/api/pins')
        .set('Authorization', 'Bearer not-the-real-token');
      expect(res.status).toBe(401);
    });

    it('rejects requests with a non-Bearer scheme (401)', async () => {
      const res = await request(app)
        .get('/api/pins')
        .set('Authorization', `Basic ${TEST_TOKEN}`);
      expect(res.status).toBe(401);
    });

    it('rejects requests with a bare "Bearer" and no value (401)', async () => {
      const res = await request(app).get('/api/pins').set('Authorization', 'Bearer');
      expect(res.status).toBe(401);
    });

    it('includes a WWW-Authenticate header on 401 responses', async () => {
      const res = await request(app).get('/api/pins');
      expect(res.status).toBe(401);
      expect(res.headers['www-authenticate']).toMatch(/^Bearer/);
    });

    it('accepts requests with the correct Bearer token (200)', async () => {
      const res = await request(app)
        .get('/api/pins')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('protects mutation endpoints (POST /api/pins → 401 with no token)', async () => {
      const res = await request(app)
        .post('/api/pins')
        .send({ type: 'task', title: 'Should not be created' });
      expect(res.status).toBe(401);
    });

    it('protects lamp endpoints (GET /api/lamp/status → 401 with no token)', async () => {
      const res = await request(app).get('/api/lamp/status');
      expect(res.status).toBe(401);
    });

    it('does not protect static / non-/api routes', async () => {
      // The catch-all serves index.html for non-/api paths in prod, or 404s in dev.
      // Either way, it should not be 401.
      const res = await request(app).get('/some-frontend-route');
      expect(res.status).not.toBe(401);
    });
  });

  describe('when CORKBOARD_AUTH=disabled', () => {
    let prev: string | undefined;

    beforeEach(() => {
      prev = process.env.CORKBOARD_AUTH;
      process.env.CORKBOARD_AUTH = 'disabled';
    });

    afterEach(() => {
      if (prev === undefined) delete process.env.CORKBOARD_AUTH;
      else process.env.CORKBOARD_AUTH = prev;
    });

    it('accepts requests with no Authorization header', async () => {
      const res = await request(app).get('/api/pins');
      expect(res.status).toBe(200);
    });

    it('accepts requests with a wrong token', async () => {
      const res = await request(app)
        .get('/api/pins')
        .set('Authorization', 'Bearer wrong');
      expect(res.status).toBe(200);
    });
  });
});
