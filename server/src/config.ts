import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load a local .env from the project root for dev/prod usage.
// Tests inject their own environment and should not read a developer's real .env.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env');
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

if (!isTestEnv && existsSync(envPath)) {
  dotenv.config({ path: envPath, quiet: true });
}

/**
 * Server configuration - uses environment variables with local defaults.
 * Set environment variables in .env for production.
 */
export const config = {
  port: Number(process.env.PORT) || 3010,
  host: process.env.CORKBOARD_HOST?.trim() || '0.0.0.0',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:5180', 'http://127.0.0.1:5180'],
  lampServer: process.env.LAMP_SERVER || '',
  ha: {
    url: process.env.HA_URL || '',
    token: process.env.HA_TOKEN || '',
    lightEntity: process.env.HA_LIGHT_ENTITY || 'light.my_light',
  },
} as const;
