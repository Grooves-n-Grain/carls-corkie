import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../config', () => ({
  config: { apiUrl: '', socketUrl: '', token: 'test-token-abc' },
}));

import { apiFetch, ApiAuthError, setAuthErrorHandler } from './apiFetch';

describe('apiFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const ok = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(ok({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    setAuthErrorHandler(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function lastInit() {
    return fetchMock.mock.calls[0][1] as RequestInit;
  }
  function lastHeaders() {
    return new Headers(lastInit().headers);
  }
  function lastUrl() {
    return fetchMock.mock.calls[0][0] as string;
  }

  it('attaches Authorization: Bearer <token> on every call', async () => {
    await apiFetch('/api/pins');
    expect(lastHeaders().get('Authorization')).toBe('Bearer test-token-abc');
  });

  it('sets Content-Type: application/json automatically when a body is present', async () => {
    await apiFetch('/api/pins', { method: 'POST', body: JSON.stringify({ x: 1 }) });
    expect(lastHeaders().get('Content-Type')).toBe('application/json');
  });

  it('does not override an explicit Content-Type', async () => {
    await apiFetch('/api/pins', {
      method: 'POST',
      body: 'raw',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(lastHeaders().get('Content-Type')).toBe('text/plain');
  });

  it('does not set Content-Type when there is no body', async () => {
    await apiFetch('/api/pins');
    expect(lastHeaders().has('Content-Type')).toBe(false);
  });

  it('prefixes relative paths with config.apiUrl', async () => {
    await apiFetch('/api/pins');
    expect(lastUrl()).toBe('/api/pins');
  });

  it('passes absolute URLs through unchanged', async () => {
    await apiFetch('https://example.com/api/pins');
    expect(lastUrl()).toBe('https://example.com/api/pins');
  });

  it('returns the response on success', async () => {
    const res = await apiFetch('/api/pins');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('throws ApiAuthError on 401', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"error":"nope"}', { status: 401 }));
    await expect(apiFetch('/api/pins')).rejects.toBeInstanceOf(ApiAuthError);
  });

  it('invokes the registered auth error handler on 401', async () => {
    const handler = vi.fn();
    setAuthErrorHandler(handler);
    fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }));
    await expect(apiFetch('/api/pins')).rejects.toBeInstanceOf(ApiAuthError);
    expect(handler).toHaveBeenCalledWith(401);
  });

  it('does not throw on non-401 error responses (caller handles)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"error":"bad"}', { status: 400 }));
    const res = await apiFetch('/api/pins');
    expect(res.status).toBe(400);
  });
});
