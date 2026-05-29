// Client-side team report generator (#9).
//
// Builds a self-contained, printable HTML document from data already loaded on
// the team detail page (team meta, per-project + per-member progress, and the
// full task board) and triggers a download. HTML keeps it "presentable" — it
// opens cleanly in any browser and prints to PDF — without pulling in a heavy
// PDF dependency.

function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(d: any): string {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString();
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'To do', in_progress: 'In progress', review: 'Review', blocked: 'Blocked', done: 'Done',
};

export function buildTeamReportHtml(team: any, progress: any, board: any[]): string {
  const generated = new Date().toLocaleString();
  const projects: any[] = progress?.projects || team?.projects || [];
  const members: any[] = progress?.members || team?.members || [];
  const tasks: any[] = board || [];

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
  const overallPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const projectRows = projects.map((p) => {
    const pct = p.taskCount ? Math.round((p.tasksDone / p.taskCount) * 100) : 0;
    return `<tr>
      <td><strong>${esc(p.code || '')}</strong> ${esc(p.name || '')}</td>
      <td>${esc(p.status || '')}</td>
      <td style="text-align:right">${esc(p.tasksDone ?? 0)}/${esc(p.taskCount ?? 0)}</td>
      <td style="text-align:right">${pct}%</td>
    </tr>`;
  }).join('');

  const memberRows = members.map((m) => {
    const pct = m.assigned ? Math.round((m.done / m.assigned) * 100) : 0;
    return `<tr>
      <td>${esc(m.name || '')}${m.title ? ` <span class="muted">· ${esc(m.title)}</span>` : ''}</td>
      <td style="text-align:right">${esc(m.assigned ?? 0)}</td>
      <td style="text-align:right">${esc(m.done ?? 0)}</td>
      <td style="text-align:right">${esc(m.overdue ?? 0)}</td>
      <td style="text-align:right">${pct}%</td>
    </tr>`;
  }).join('');

  const taskRows = tasks.map((t) => {
    const od = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
    return `<tr>
      <td>${esc(t.title || '')}</td>
      <td>${esc(t.projectCode || '')}</td>
      <td>${esc(t.assigneeName || 'Unassigned')}</td>
      <td>${esc(STATUS_LABEL[t.status] || t.status || '')}</td>
      <td style="${od ? 'color:#b91c1c;font-weight:600' : ''}">${fmtDate(t.dueDate)}</td>
    </tr>`;
  }).join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(team?.name || 'Team')} — Report</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#0f172a; margin:40px; }
  h1 { font-size:24px; margin:0 0 4px; }
  h2 { font-size:15px; margin:28px 0 8px; text-transform:uppercase; letter-spacing:.06em; color:#475569; }
  .muted { color:#94a3b8; }
  .sub { color:#64748b; margin:0 0 16px; font-size:13px; }
  .kpis { display:flex; gap:12px; flex-wrap:wrap; margin:16px 0; }
  .kpi { border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px; min-width:120px; }
  .kpi .n { font-size:22px; font-weight:800; }
  .kpi .l { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:#64748b; }
  table { width:100%; border-collapse:collapse; font-size:13px; margin-bottom:8px; }
  th, td { text-align:left; padding:7px 8px; border-bottom:1px solid #eef2f7; }
  th { font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:#64748b; }
  @media print { body { margin:16px; } }
</style></head>
<body>
  <h1>${esc(team?.name || 'Team')}</h1>
  <p class="sub">${esc(team?.description || '')}${team?.function ? ` · Function: ${esc(team.function)}` : ''}<br>
    Generated ${esc(generated)}</p>

  <div class="kpis">
    <div class="kpi"><div class="n">${projects.length}</div><div class="l">Projects</div></div>
    <div class="kpi"><div class="n">${members.length}</div><div class="l">Members</div></div>
    <div class="kpi"><div class="n">${doneTasks}/${totalTasks}</div><div class="l">Tasks done</div></div>
    <div class="kpi"><div class="n">${overallPct}%</div><div class="l">Completion</div></div>
    <div class="kpi"><div class="n" style="${overdue ? 'color:#b91c1c' : ''}">${overdue}</div><div class="l">Overdue</div></div>
  </div>

  <h2>Projects</h2>
  <table><thead><tr><th>Project</th><th>Status</th><th style="text-align:right">Tasks</th><th style="text-align:right">Progress</th></tr></thead>
  <tbody>${projectRows || '<tr><td colspan="4" class="muted">No projects.</td></tr>'}</tbody></table>

  <h2>Members</h2>
  <table><thead><tr><th>Member</th><th style="text-align:right">Assigned</th><th style="text-align:right">Done</th><th style="text-align:right">Overdue</th><th style="text-align:right">Progress</th></tr></thead>
  <tbody>${memberRows || '<tr><td colspan="5" class="muted">No members.</td></tr>'}</tbody></table>

  <h2>All tasks</h2>
  <table><thead><tr><th>Task</th><th>Project</th><th>Assignee</th><th>Status</th><th>Due</th></tr></thead>
  <tbody>${taskRows || '<tr><td colspan="5" class="muted">No tasks.</td></tr>'}</tbody></table>
</body></html>`;
}

export function downloadTeamReport(team: any, progress: any, board: any[]) {
  const html = buildTeamReportHtml(team, progress, board);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = String(team?.name || 'team').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  a.href = url;
  a.download = `${safeName}-report-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
