import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { io as ioClient, type Socket } from 'socket.io-client';
import type { AddressInfo } from 'net';
import { httpServer } from './app.js';

const TEST_TOKEN = process.env.CORKBOARD_TOKEN!;

let baseUrl: string;
const openSockets: Socket[] = [];

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = httpServer.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  for (const s of openSockets) s.close();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

afterEach(() => {
  while (openSockets.length) {
    openSockets.pop()?.close();
  }
});

function connect(authPayload: Record<string, unknown> | undefined): Promise<{
  status: 'connected' | 'error';
  errorMessage?: string;
}> {
  return new Promise((resolve) => {
    const socket = ioClient(baseUrl, {
      auth: authPayload,
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
    });
    openSockets.push(socket);
    socket.on('connect', () => resolve({ status: 'connected' }));
    socket.on('connect_error', (err) =>
      resolve({ status: 'error', errorMessage: err.message }),
    );
  });
}

describe('Socket.io handshake auth', () => {
  it('rejects connection with no auth payload', async () => {
    const r = await connect(undefined);
    expect(r.status).toBe('error');
    expect(r.errorMessage).toBe('Unauthorized');
  });

  it('rejects connection with empty auth object', async () => {
    const r = await connect({});
    expect(r.status).toBe('error');
    expect(r.errorMessage).toBe('Unauthorized');
  });

  it('rejects connection with wrong token', async () => {
    const r = await connect({ token: 'definitely-not-the-token' });
    expect(r.status).toBe('error');
    expect(r.errorMessage).toBe('Unauthorized');
  });

  it('rejects connection with non-string token', async () => {
    const r = await connect({ token: 12345 });
    expect(r.status).toBe('error');
    expect(r.errorMessage).toBe('Unauthorized');
  });

  it('accepts connection with the correct token', async () => {
    const r = await connect({ token: TEST_TOKEN });
    expect(r.status).toBe('connected');
  });

  describe('with CORKBOARD_AUTH=disabled', () => {
    let prev: string | undefined;
    beforeEach(() => {
      prev = process.env.CORKBOARD_AUTH;
      process.env.CORKBOARD_AUTH = 'disabled';
    });
    afterEach(() => {
      if (prev === undefined) delete process.env.CORKBOARD_AUTH;
      else process.env.CORKBOARD_AUTH = prev;
    });

    it('accepts connection with no token', async () => {
      const r = await connect(undefined);
      expect(r.status).toBe('connected');
    });

    it('accepts connection with wrong token', async () => {
      const r = await connect({ token: 'wrong' });
      expect(r.status).toBe('connected');
    });
  });
});
