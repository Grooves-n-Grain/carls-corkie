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

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);

  if (config.token) {
    headers.set('Authorization', `Bearer ${config.token}`);
  }
  if (init.body && !headers.has('Content-Type')) {
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
