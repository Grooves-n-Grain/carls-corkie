import { config } from '../config';

export class ApiAuthError extends Error {
  constructor(public status: number, message = 'Authentication failed') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

type AuthErrorHandler = (status: number) => void;
let authErrorHandler: AuthErrorHandler | null = null;

export function setAuthErrorHandler(fn: AuthErrorHandler | null): void {
  authErrorHandler = fn;
}

function isInternalUrl(path: string): boolean {
  // Relative paths are always internal — they target our own server.
  if (!path.startsWith('http://') && !path.startsWith('https://')) return true;
  // Absolute URLs only count as internal when they match a configured apiUrl.
  // If apiUrl is empty (same-origin mode), any absolute URL is treated as external.
  if (!config.apiUrl) return false;
  return path.startsWith(config.apiUrl);
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);

  // Only attach the bearer token to internal calls. Sending it to a third-party
  // host (e.g. apiFetch('https://api.openai.com/...')) would leak the secret.
  if (config.token && isInternalUrl(path)) {
    headers.set('Authorization', `Bearer ${config.token}`);
  }
  // Only set Content-Type for string bodies. FormData/Blob/ArrayBuffer payloads
  // need fetch to set it itself so the multipart boundary or binary type is correct.
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = path.startsWith('http') ? path : `${config.apiUrl}${path}`;

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    authErrorHandler?.(401);
    throw new ApiAuthError(401);
  }

  return res;
}
