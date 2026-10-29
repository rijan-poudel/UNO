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
      'Playwright could not be resolved via standard package resolution or environment variables.\n' +
        'Please ensure playwright is installed or set PLAYWRIGHT_PATH / PLAYWRIGHT_MODULE_PATH to the playwright package or entrypoint.',
    );
  }
  const mod = await import(resolved);
  return mod.chromium;
}
