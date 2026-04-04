import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const tempDir = mkdtempSync(join(tmpdir(), 'corkboard-vitest-'));

process.env.CORKBOARD_DB_PATH = join(tempDir, 'corkboard.test.db');
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.HA_URL = '';
process.env.HA_TOKEN = '';
process.env.HA_LIGHT_ENTITY = 'light.my_light';
process.env.LAMP_SERVER = '';

process.on('exit', () => {
  rmSync(tempDir, { recursive: true, force: true });
});
