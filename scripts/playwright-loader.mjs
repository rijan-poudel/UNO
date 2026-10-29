import { createRequire } from 'node:module';
import fs from 'node:fs';

export async function getChromium() {
  const require = createRequire(import.meta.url);
  let resolved;
  try {
    resolved = require.resolve('playwright');
  } catch {
    const candidates = [
      process.env.PLAYWRIGHT_PATH,
      process.env.PLAYWRIGHT_MODULE_PATH,
      '/Users/rizx/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs',
    ].filter(Boolean);
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        resolved = c;
        break;
      }
    }
  }
  if (!resolved) {
    throw new Error(
      'Playwright could not be resolved. Please ensure playwright is available or set PLAYWRIGHT_PATH.',
    );
  }
  const mod = await import(resolved);
  return mod.chromium;
}
