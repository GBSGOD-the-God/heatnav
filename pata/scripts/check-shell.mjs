// The service worker precaches a hand-written list of built chunks. When the
// bundler emits a new one and the list is not updated, the first offline run
// fetches a file that was never cached and fails — silently, and only for the
// users who are offline. Fail the build here instead.
import { readdirSync, readFileSync } from 'node:fs';

const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const built = readdirSync(new URL('../dist/assets', import.meta.url)).filter((f) => f.endsWith('.js'));
const missing = built.filter((f) => !sw.includes(`./assets/${f}`));

if (missing.length) {
  console.error(
    `\nservice worker precache is out of date.\n` +
      `Add these to SHELL in public/sw.js:\n` +
      missing.map((f) => `  './assets/${f}',`).join('\n') + '\n'
  );
  process.exit(1);
}
console.log(`service worker precaches all ${built.length} built chunks`);
