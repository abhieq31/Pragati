// ─── Bird's-eye view — pure layout & export helpers ──────────────────────────
// No React, no 'use client'. Split out from BirdEyeView.tsx so pages can compute
// a layout and download the presentable SVG (both tiny) without eagerly pulling
// the heavy interactive canvas component into their first-load bundle — the
// component itself is lazy-loaded where it's actually opened.

export interface BirdEyeNode {
  id: string;
  type: 'project' | 'task' | 'person';
  x: number;
  y: number;
  data: any;
}

export interface BirdEyeEdge {
  from: string;
  to: string;
  label?: string;
}

/* ── Node dimensions ─────────────────────────────────────────────────────── */

export const NODE_SIZE: Record<BirdEyeNode['type'], { w: number; h: number }> = {
  project: { w: 200, h: 110 },
  task: { w: 170, h: 82 },
  person: { w: 100, h: 80 },
};

/* The fixed SVG user-space the canvas is drawn in (viewBox). */
export const CANVAS_W = 1200;
export const CANVAS_H = 800;

const LAYOUT_CX = 600;
const LAYOUT_CY = 400;

/* ── Status helpers ──────────────────────────────────────────────────────── */

export const STATUS_COLOR: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  blocked: '#ef4444',
  done: '#22c55e',
  planning: '#94a3b8',
  on_hold: '#f59e0b',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

export const STATUS_LABEL: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  blocked: 'Blocked',
  done: 'Done',
  planning: 'Planning',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function formatDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();
}

/* ── Layout helpers ──────────────────────────────────────────────────────── */

/**
 * Radius for a ring of `count` evenly-spaced cards such that neighbours never
 * overlap. The chord between adjacent card centres is 2·r·sin(π/count); we
 * require it to clear the wider card dimension plus a gap, then solve for r and
 * clamp to a sensible minimum. This is what makes the view legible whether a
 * project has 3 tasks or 30 — the ring simply grows instead of cards colliding.
 */
function ringRadius(count: number, cardW: number, cardH: number, gap: number, minR: number): number {
  if (count <= 1) return minR;
  const span = Math.max(cardW, cardH) + gap;
  const needed = span / (2 * Math.sin(Math.PI / count));
  return Math.max(minR, needed);
}

export function getInitialLayout(
  project: any,
  tasks: any[],
): { nodes: BirdEyeNode[]; edges: BirdEyeEdge[] } {
  const cx = LAYOUT_CX;
  const cy = LAYOUT_CY;
  const nodes: BirdEyeNode[] = [];
  const edges: BirdEyeEdge[] = [];
  const T = NODE_SIZE.task;
  const P = NODE_SIZE.person;

  // Project at centre
  nodes.push({ id: `proj-${project.id}`, type: 'project', x: cx, y: cy, data: project });

  // Tasks on a ring whose radius grows with the task count so cards never collide
  const taskR = ringRadius(tasks.length, T.w, T.h, 64, 230);
  tasks.forEach((t, i) => {
    const angle = (i / Math.max(tasks.length, 1)) * 2 * Math.PI - Math.PI / 2;
    nodes.push({
      id: `task-${t.id}`,
      type: 'task',
      x: cx + taskR * Math.cos(angle),
      y: cy + taskR * Math.sin(angle),
      data: t,
    });
    edges.push({ from: `proj-${project.id}`, to: `task-${t.id}` });
  });

  // People on an outer ring — deduplicate by assigneeId
  const seen = new Set<string>();
  const uniquePeople: { id: string; name: string }[] = [];
  tasks.forEach((t) => {
    if (t.assigneeId && !seen.has(t.assigneeId)) {
      seen.add(t.assigneeId);
      uniquePeople.push({ id: t.assigneeId, name: t.assigneeName || 'Unknown' });
    }
  });

  // Outer ring must clear the task ring radially AND keep people apart laterally.
  const peopleR = Math.max(
    taskR + T.h / 2 + P.h / 2 + 90,
    ringRadius(uniquePeople.length, P.w, P.h, 48, 0),
  );
  uniquePeople.forEach((p, i) => {
    const angle = (i / Math.max(uniquePeople.length, 1)) * 2 * Math.PI;
    nodes.push({
      id: `person-${p.id}`,
      type: 'person',
      x: cx + peopleR * Math.cos(angle),
      y: cy + peopleR * Math.sin(angle),
      data: p,
    });
    tasks
      .filter((t) => t.assigneeId === p.id)
      .forEach((t) => {
        edges.push({ from: `task-${t.id}`, to: `person-${p.id}` });
      });
  });

  return { nodes, edges };
}

/** Layout for a team canvas: team at centre, projects in middle ring, members in outer ring. */
export function getTeamLayout(
  team: any,
  projects: any[],
  members: any[],
): { nodes: BirdEyeNode[]; edges: BirdEyeEdge[] } {
  const cx = LAYOUT_CX;
  const cy = LAYOUT_CY;
  const nodes: BirdEyeNode[] = [];
  const edges: BirdEyeEdge[] = [];
  const T = NODE_SIZE.task;
  const P = NODE_SIZE.person;

  nodes.push({ id: `team-${team.id}`, type: 'project', x: cx, y: cy, data: { ...team, name: team.name, code: team.function || 'TEAM' } });

  const projR = ringRadius(projects.length, T.w, T.h, 70, 250);
  projects.forEach((p, i) => {
    const angle = (i / Math.max(projects.length, 1)) * 2 * Math.PI - Math.PI / 2;
    nodes.push({ id: `proj-${p.id}`, type: 'task', x: cx + projR * Math.cos(angle), y: cy + projR * Math.sin(angle), data: p });
    edges.push({ from: `team-${team.id}`, to: `proj-${p.id}` });
  });

  const memR = Math.max(
    projR + T.h / 2 + P.h / 2 + 90,
    ringRadius(members.length, P.w, P.h, 48, 0),
  );
  members.forEach((m, i) => {
    const angle = (i / Math.max(members.length, 1)) * 2 * Math.PI;
    nodes.push({ id: `person-${m.id}`, type: 'person', x: cx + memR * Math.cos(angle), y: cy + memR * Math.sin(angle), data: m });
    edges.push({ from: `team-${team.id}`, to: `person-${m.id}` });
  });

  return { nodes, edges };
}

/** Fit every node into the canvas, centred, with padding — returns pan + scale. */
export function computeFit(ns: BirdEyeNode[]): { pan: { x: number; y: number }; scale: number } {
  if (!ns.length) return { pan: { x: 0, y: 0 }, scale: 1 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of ns) {
    const s = NODE_SIZE[n.type];
    minX = Math.min(minX, n.x - s.w / 2);
    minY = Math.min(minY, n.y - s.h / 2);
    maxX = Math.max(maxX, n.x + s.w / 2);
    maxY = Math.max(maxY, n.y + s.h / 2);
  }
  const pad = 80;
  const cw = Math.max(1, maxX - minX);
  const ch = Math.max(1, maxY - minY);
  const scale = Math.max(0.3, Math.min(1.4, Math.min((CANVAS_W - pad * 2) / cw, (CANVAS_H - pad * 2) / ch)));
  return {
    scale,
    pan: { x: (CANVAS_W - cw * scale) / 2 - minX * scale, y: (CANVAS_H - ch * scale) / 2 - minY * scale },
  };
}

/* ── Presentable SVG export ──────────────────────────────────────────────────
   Renders the graph as a standalone, light-themed SVG with real titled cards
   (full titles wrapped, not truncated) — a "view from above" artifact that
   prints and shares cleanly, independent of the interactive canvas. */

function xmlEsc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Greedy word-wrap into at most maxLines lines of ~maxChars chars (ellipsised if longer). */
function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars) { cur = next; continue; }
    if (cur) lines.push(cur);
    cur = w;
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length > maxLines) lines.length = maxLines;
  const joined = lines.join(' ').replace(/\s+/g, ' ');
  if (joined.replace(/…$/, '').length < String(text || '').replace(/\s+/g, ' ').trim().length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s+\S*$/, '') + '…';
  }
  return lines;
}

export function buildBirdEyeSvg(
  title: string,
  nodes: BirdEyeNode[],
  edges: BirdEyeEdge[],
  exportedBy: string,
): string {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const EXPORT_W = { project: 248, task: 214, person: 120 };
  for (const n of nodes) {
    const w = (EXPORT_W as any)[n.type] ?? 200;
    minX = Math.min(minX, n.x - w / 2);
    minY = Math.min(minY, n.y - 60);
    maxX = Math.max(maxX, n.x + w / 2);
    maxY = Math.max(maxY, n.y + 60);
  }
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = CANVAS_W; maxY = CANVAS_H; }
  const padX = 64, padTop = 116, padBottom = 64;
  const vbX = minX - padX, vbY = minY - padTop;
  const vbW = (maxX - minX) + padX * 2, vbH = (maxY - minY) + padTop + padBottom;

  const edgeSvg = edges.map((e) => {
    const a = nodes.find((n) => n.id === e.from);
    const b = nodes.find((n) => n.id === e.to);
    if (!a || !b) return '';
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const qx = mx + (b.y - a.y) * 0.07, qy = my - (b.x - a.x) * 0.07;
    return `<path d="M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}" fill="none" stroke="#cbd5e1" stroke-width="1.4" stroke-dasharray="5 4"/>`;
  }).join('');

  const cardSvg = nodes.map((n) => {
    if (n.type === 'person') {
      const name = n.data?.name || 'Unknown';
      return `<g>
        <circle cx="${n.x}" cy="${n.y - 12}" r="23" fill="#1565C0"/>
        <text x="${n.x}" y="${n.y - 12}" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="700" fill="#ffffff">${xmlEsc(initials(name))}</text>
        <text x="${n.x}" y="${n.y + 26}" text-anchor="middle" font-size="12.5" font-weight="600" fill="#334155">${xmlEsc(name)}</text>
      </g>`;
    }
    const isProject = n.type === 'project';
    const heading = isProject ? (n.data?.name || 'Project') : (n.data?.title || 'Task');
    const status = n.data?.status || '';
    const color = STATUS_COLOR[status] || '#94a3b8';
    const kicker = isProject ? (n.data?.code || 'PROJECT') : (STATUS_LABEL[status] || 'Task');
    const lines = wrapLines(heading, isProject ? 28 : 26, 4);
    const lineH = 17, headerH = 24, metaH = 20;
    const cardW = (EXPORT_W as any)[n.type];
    const cardH = headerH + lines.length * lineH + metaH + 14;
    const x = n.x - cardW / 2, y = n.y - cardH / 2;
    const assignee = n.data?.assigneeName || n.data?.ownerName || '';
    const due = formatDate(n.data?.dueDate || n.data?.ccTcd);
    const meta = `${assignee || (isProject ? '' : 'Unassigned')}${(due && due !== '—') ? `${assignee || !isProject ? '  ·  ' : ''}${due}` : ''}`;
    const titleSpans = lines.map((ln, i) => `<tspan x="${x + 15}" dy="${i === 0 ? 0 : lineH}">${xmlEsc(ln)}</tspan>`).join('');
    return `<g>
      <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="13" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
      <rect x="${x}" y="${y}" width="5" height="${cardH}" rx="2.5" fill="${color}"/>
      <circle cx="${x + 18}" cy="${y + 16}" r="3.5" fill="${color}"/>
      <text x="${x + 28}" y="${y + 16}" dominant-baseline="central" font-size="9.5" font-weight="700" letter-spacing="0.6" fill="${color}">${xmlEsc(String(kicker).toUpperCase())}</text>
      <text x="${x + 15}" y="${y + headerH + 13}" font-size="13.5" font-weight="700" fill="#1e293b">${titleSpans}</text>
      ${meta ? `<text x="${x + 15}" y="${y + cardH - 13}" font-size="11" fill="#64748b">${xmlEsc(meta)}</text>` : ''}
    </g>`;
  }).join('');

  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(0)} ${vbY.toFixed(0)} ${vbW.toFixed(0)} ${vbH.toFixed(0)}" width="${vbW.toFixed(0)}" height="${vbH.toFixed(0)}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
  <rect x="${vbX.toFixed(0)}" y="${vbY.toFixed(0)}" width="${vbW.toFixed(0)}" height="${vbH.toFixed(0)}" fill="#f8fafc"/>
  <text x="${(vbX + 30).toFixed(0)}" y="${(vbY + 46).toFixed(0)}" font-size="23" font-weight="800" fill="#0f172a">${xmlEsc(title)}</text>
  <text x="${(vbX + 30).toFixed(0)}" y="${(vbY + 70).toFixed(0)}" font-size="12.5" font-weight="600" fill="#64748b">Bird's-eye view · Pragati</text>
  ${edgeSvg}
  ${cardSvg}
  <text x="${(vbX + 30).toFixed(0)}" y="${(vbY + vbH - 22).toFixed(0)}" font-size="11" fill="#94a3b8">${exportedBy ? `Exported by ${xmlEsc(exportedBy)} · ` : ''}${xmlEsc(dateStr)}</text>
</svg>`;
}

/** Build the presentable SVG and trigger a browser download. */
export function downloadBirdEyeSvg(title: string, nodes: BirdEyeNode[], edges: BirdEyeEdge[], exportedBy: string) {
  const svg = buildBirdEyeSvg(title, nodes, edges, exportedBy);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(title || 'birds_eye').replace(/\s+/g, '_')}_birds_eye.svg`;
  a.click();
  URL.revokeObjectURL(url);
}
