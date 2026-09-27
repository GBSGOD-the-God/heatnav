// Renders poster.html to a 300dpi A4 PNG. Needs Chromium and the Google Fonts
// the page pulls in, so it wants a network the first time.
//   node pata/poster/render.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const PAGE_H = 1754; // A4 at 150 CSS px/in; deviceScaleFactor 2 makes it 300dpi

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 1240, height: PAGE_H },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto('file://' + join(here, 'poster.html'));
await page.waitForLoadState('networkidle');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2500); // Indic webfonts settle late; screenshotting early loses them

// Fail loudly if the page grew past the sheet — that means something overflowed
// and the bottom of the poster would be cut off.
const h = await page.evaluate(() => document.body.scrollHeight);
console.log('body scrollHeight:', h, h > PAGE_H ? 'OVERFLOW' : 'fits');

await page.screenshot({ path: join(here, 'pata-poster.png') });
await browser.close();
