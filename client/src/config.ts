/**
 * Client configuration - uses environment variables with sensible defaults.
 * Empty string means "same origin" — works with Vite proxy in dev
 * and same-origin Express in production.
 */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  socketUrl: import.meta.env.VITE_SOCKET_URL || '',
  token: import.meta.env.VITE_CORKBOARD_TOKEN || '',
} as const;

if (import.meta.env.DEV && !config.token) {
  console.error(
    '[corkie] VITE_CORKBOARD_TOKEN is empty. Run `npm run token:show` to verify, or `npm run token:rotate` to regenerate, then restart the dev server.',
  );
}
