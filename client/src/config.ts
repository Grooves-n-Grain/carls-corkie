/**
 * Client configuration - uses environment variables with sensible defaults.
 * Empty string means "same origin" — works with Vite proxy in dev
 * and same-origin Express in production.
 */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  socketUrl: import.meta.env.VITE_SOCKET_URL || '',
} as const;
