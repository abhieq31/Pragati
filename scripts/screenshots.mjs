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

async function login(page, email = 'satya@qinformx.local', password = 'satya123') {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[type=email]');
  await page.type('input[type=email]', email);
  await page.type('input[type=password]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    })
  ]);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--lang=en-US']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  console.log('Capturing refreshed pages…');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page);
  await shot(page, 'w1-01-login');

  console.log('Logging in as Satya…');
  await login(page);
  await waitForNetworkQuiet(page, 800);
  await shot(page, 'w1-02-dashboard-today-this-week-later');

  console.log('→ /projects/new (simplified form)');
  await page.goto(`${BASE}/projects/new`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 600);
  await shot(page, 'w1-03-new-project-minimal');

  // Fill in a name and capture the "more options" state
  await page.type('input[placeholder*="LIMS"]', 'Quick standalone project');
  await new Promise((r) => setTimeout(r, 200));
  const moreBtn = await page.evaluateHandle(() => {
    return [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Add optional details')
    );
  });
  if (moreBtn && moreBtn.asElement()) {
    await moreBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 300));
    await shot(page, 'w1-04-new-project-more-options');
  }

  console.log('→ /applications');
  await page.goto(`${BASE}/applications`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 600);
  await shot(page, 'w1-05-applications');

  console.log('→ Cmd-K palette');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 800);
  // Open palette via synthetic event
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  });
  await new Promise((r) => setTimeout(r, 300));
  await page.keyboard.type('LIMS');
  await new Promise((r) => setTimeout(r, 500));
  await shot(page, 'w1-06-cmdk-search', { fullPage: false });

  console.log('→ toggle a task to done (celebrate)');
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 200));
  const checked = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Mark as done"]');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (checked) {
    await new Promise((r) => setTimeout(r, 800));
    await shot(page, 'w1-07-one-click-done-toast', { fullPage: false });
  } else {
    console.log('  (no open task found to toggle)');
  }

  await browser.close();
  console.log('\n✅ done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
