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

  console.log('Capturing public pages…');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page);
  await shot(page, '01-login');

  console.log('Logging in as Satya (DGM · QI, manager)…');
  await login(page);
  await waitForNetworkQuiet(page);
  await shot(page, '02-dashboard');

  const routes = [
    { url: '/applications', name: '03-applications-list' },
    { url: '/projects', name: '05-projects-list' },
    { url: '/teams', name: '07-teams' },
    { url: '/yearly', name: '09-yearly' },
    { url: '/org', name: '10-org-overview' },
    { url: '/ai/triage', name: '11-ai-triage-empty' },
    { url: '/ai/risk', name: '12-ai-risk' }
  ];

  for (const r of routes) {
    console.log(`→ ${r.url}`);
    await page.goto(`${BASE}${r.url}`, { waitUntil: 'networkidle2' });
    await waitForNetworkQuiet(page, 900);
    await shot(page, r.name);
  }

  // deep links — pick a specific app, project, task
  console.log('→ LIMS application detail (bottleneck heatmap)');
  const apps = await page.evaluate(async () => {
    const r = await fetch('/api/applications');
    return r.json();
  });
  const lims = apps.find((a) => a.key === 'LIMS');
  if (lims) {
    await page.goto(`${BASE}/applications/${lims.id}`, { waitUntil: 'networkidle2' });
    await waitForNetworkQuiet(page, 1200);
    await shot(page, '04-application-lims-bottlenecks');
  }

  console.log('→ Project detail');
  const projects = await page.evaluate(async () => {
    const r = await fetch('/api/projects');
    return r.json();
  });
  const devProj =
    projects.find((p) => p.code?.startsWith('DEV')) ||
    projects.find((p) => p.lifecycle === 'csv') ||
    projects[0];
  if (devProj) {
    await page.goto(`${BASE}/projects/${devProj.id}`, { waitUntil: 'networkidle2' });
    await waitForNetworkQuiet(page, 900);
    await shot(page, '06-project-detail');
  }

  console.log('→ Task detail with AI triage panel (after running triage)');
  if (devProj) {
    const tasks = await page.evaluate(async (pid) => {
      const r = await fetch(`/api/projects/${pid}`);
      const d = await r.json();
      return d.tasks;
    }, devProj.id);
    const devTask = tasks.find((t) => t.taskType === 'deviation') || tasks[0];
    if (devTask) {
      // Run AI triage via API so the panel is populated
      await page.evaluate(async (tid) => {
        await fetch('/api/ai/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Log deviation with initial description',
            description:
              'Shared login used on chromatography data system during batch release. Audit trail review shows 3 batches impacted. Possible ALCOA+ violation; potential FDA exposure.',
            taskId: tid,
            save: true
          })
        });
      }, devTask.id);
      await page.goto(`${BASE}/tasks/${devTask.id}`, { waitUntil: 'networkidle2' });
      await waitForNetworkQuiet(page, 900);
      await shot(page, '08-task-detail');
    }
  }

  console.log('→ AI triage — fill and run example');
  await page.goto(`${BASE}/ai/triage`, { waitUntil: 'networkidle2' });
  await waitForNetworkQuiet(page, 600);
  // click the first example button
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => x.textContent?.includes('Shared login on HPLC system'));
    if (b) { b.click(); return true; }
    return false;
  });
  if (clicked) {
    // click Run triage
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => x.textContent?.trim() === 'Run triage');
      if (b) b.click();
    });
    await waitForNetworkQuiet(page, 1200);
    await new Promise((r) => setTimeout(r, 600));
    await shot(page, '13-ai-triage-result');
  }

  // Sign out & login as a regular member to show the other perspective
  console.log('Logging out and re-authing as Karan (member)…');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  // Force logout via API
  await page.evaluate(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
  });
  await login(page, 'karan@qinformx.local', 'karan123');
  await waitForNetworkQuiet(page, 800);
  await shot(page, '14-dashboard-member-view');

  await browser.close();

  const pngs = fs.readdirSync(OUT).filter((f) => f.endsWith('.png')).sort();
  console.log(`\n✅ wrote ${pngs.length} screenshots to ${OUT}`);
  for (const p of pngs) console.log('  ' + path.join(OUT, p));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
