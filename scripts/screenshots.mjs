import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.env.OUT || '/opt/cursor/artifacts/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const CHROME = '/usr/bin/google-chrome';

async function waitForNetworkQuiet(page, ms = 600) {
  await page.waitForNetworkIdle({ idleTime: ms }).catch(() => {});
  await new Promise((r) => setTimeout(r, 300));
}
async function shot(page, name, opts = {}) {
  const fullPage = opts.fullPage !== false;
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage });
  console.log(`  📸 ${name}.png`);
  return p;
}
async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[type=email]');
  await page.type('input[type=email]', email);
  await page.type('input[type=password]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.evaluate(() => document.querySelector('form')?.requestSubmit())
  ]);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page);
  await shot(page, 'v1-01-login');

  console.log('Satya (manager)');
  await login(page, 'satya@qinformx.local', 'satya123');
  await waitForNetworkQuiet(page, 800);
  await shot(page, 'v1-02-dashboard');

  await page.goto(`${BASE}/reportings`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 800);
  await shot(page, 'v1-03-my-reportings');

  await page.goto(`${BASE}/applications`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 800);
  await shot(page, 'v1-04-applications');

  // LIMS bottleneck
  const apps = await page.evaluate(async () => (await fetch('/api/applications')).json());
  const lims = apps.find((a) => a.key === 'LIMS');
  if (lims) {
    await page.goto(`${BASE}/applications/${lims.id}`, { waitUntil: 'networkidle2' });
    await waitForNetworkQuiet(page, 1200);
    await shot(page, 'v1-05-lims-bottleneck');
  }

  await page.goto(`${BASE}/projects/new`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 600);
  await shot(page, 'v1-06-new-project-minimal');

  await page.goto(`${BASE}/yearly`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 900);
  await shot(page, 'v1-07-yearly');

  await page.goto(`${BASE}/ai/risk`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 1200);
  await shot(page, 'v1-08-ai-risk');

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 600);
  await page.evaluate(() =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  );
  await new Promise((r) => setTimeout(r, 300));
  await page.keyboard.type('audit');
  await new Promise((r) => setTimeout(r, 600));
  await shot(page, 'v1-09-cmdk', { fullPage: false });

  await browser.close();
  console.log('✅ done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
