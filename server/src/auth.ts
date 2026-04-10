import type { Request, Response, NextFunction } from 'express';
import type { Socket } from 'socket.io';

const UNAUTHORIZED = {
  error: 'Missing or invalid token',
  docs: 'See README.md#authentication',
};

function isAuthDisabled(): boolean {
  return process.env.CORKBOARD_AUTH === 'disabled';
}

function expectedToken(): string | undefined {
  const t = process.env.CORKBOARD_TOKEN?.trim();
  return t ? t : undefined;
}

function extractBearer(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const parts = header.split(/\s+/);
  if (parts.length !== 2) return undefined;
  if (parts[0].toLowerCase() !== 'bearer') return undefined;
  const value = parts[1].trim();
  return value || undefined;
}

export function requireToken(req: Request, res: Response, next: NextFunction): void {
  if (isAuthDisabled()) {
    next();
    return;
  }
  const expected = expectedToken();
  if (!expected) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="corkboard"');
    res.status(500).json({
      error: 'Server has no CORKBOARD_TOKEN configured',
      docs: 'See README.md#authentication',
    });
    return;
  }
  const provided = extractBearer(req.headers.authorization);
  if (provided !== expected) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="corkboard"');
    res.status(401).json(UNAUTHORIZED);
    return;
  }
  next();
}

export function requireSocketToken(socket: Socket, next: (err?: Error) => void): void {
  if (isAuthDisabled()) {
    next();
    return;
  }
  const expected = expectedToken();
  if (!expected) {
    next(new Error('Server has no CORKBOARD_TOKEN configured'));
    return;
  }
  const auth = socket.handshake.auth as { token?: unknown } | undefined;
  const provided = typeof auth?.token === 'string' ? auth.token.trim() : '';
  if (provided !== expected) {
    next(new Error('Unauthorized'));
    return;
  }
  next();
}

export function logAuthStateOnStartup(): void {
  if (isAuthDisabled()) {
    console.warn('\n  ⚠️  CORKBOARD_AUTH=disabled — all requests accepted without authentication. DO NOT USE IN PRODUCTION.\n');
    return;
  }
  const tok = expectedToken();
  if (!tok) {
    console.error('\n  ❌ CORKBOARD_TOKEN is not set. Requests will be rejected with 500.\n');
    return;
  }
  console.log(`  Auth: enabled (token ending ...${tok.slice(-6)})`);
}
