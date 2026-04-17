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

  console.log('Satya view');
  await login(page, 'satya@qinformx.local', 'satya123');
  await waitForNetworkQuiet(page, 800);
  await shot(page, 'w2-01-dashboard-macro-trail');

  await page.goto(`${BASE}/reportings`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 900);
  await shot(page, 'w2-02-my-reportings');

  console.log('Admin view (users page)');
  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }));
  await login(page, 'admin@qinformx.local', 'admin123');
  await waitForNetworkQuiet(page, 600);
  await page.goto(`${BASE}/admin/users`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 700);
  await shot(page, 'w2-03-admin-users');

  await browser.close();
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
