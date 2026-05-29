'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client/api';

// GitHub-style contribution heatmap of the signed-in user's completed tasks
// over the last year (#7). Data comes from /api/users/me/activity.

function cellColor(n: number): string {
  if (!n) return '#ebedf0';
  if (n <= 2) return '#9be9a8';
  if (n <= 4) return '#40c463';
  if (n <= 6) return '#30a14e';
  return '#216e39';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ActivityGraph() {
  const [days, setDays] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    api<any>('/users/me/activity')
      .then((d) => setDays(d.days || {}))
      .catch(() => setDays({}));
  }, []);

  const { weeks, total } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 363);
    start.setDate(start.getDate() - start.getDay()); // align to Sunday

    const cols: { key: string; inRange: boolean }[][] = [];
    const cur = new Date(start);
    while (cur <= today) {
      const col: { key: string; inRange: boolean }[] = [];
      for (let i = 0; i < 7; i++) {
        col.push({ key: cur.toISOString().slice(0, 10), inRange: cur <= today });
        cur.setDate(cur.getDate() + 1);
      }
      cols.push(col);
    }
    let t = 0;
    if (days) for (const k in days) t += days[k];
    return { weeks: cols, total: t };
  }, [days]);

  // Month labels: show a label above the first week whose first day starts a
  // new month versus the previous column.
  const monthLabels = useMemo(() => {
    const labels: (string | null)[] = [];
    let lastMonth = -1;
    for (const col of weeks) {
      const d = new Date(col[0].key);
      const m = d.getMonth();
      if (m !== lastMonth) { labels.push(MONTHS[m]); lastMonth = m; }
      else labels.push(null);
    }
    return labels;
  }, [weeks]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-slate-400">
          {days === null ? 'Loading…' : <><strong className="text-slate-600">{total}</strong> tasks completed in the last year</>}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 ml-0">
            {monthLabels.map((m, i) => (
              <div key={i} style={{ width: 11 }} className="text-[8px] text-slate-400 leading-none">
                {m || ''}
              </div>
            ))}
          </div>
          {/* Week columns */}
          <div className="flex gap-[3px]">
            {weeks.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell) => {
                  const count = (days && days[cell.key]) || 0;
                  if (!cell.inRange) {
                    return <div key={cell.key} style={{ width: 11, height: 11 }} />;
                  }
                  return (
                    <div
                      key={cell.key}
                      title={`${count} completed · ${cell.key}`}
                      style={{ width: 11, height: 11, borderRadius: 2, background: cellColor(count) }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[9px] text-slate-400">Less</span>
        {[0, 2, 4, 6, 8].map((n) => (
          <div key={n} style={{ width: 10, height: 10, borderRadius: 2, background: cellColor(n) }} />
        ))}
        <span className="text-[9px] text-slate-400">More</span>
      </div>
    </div>
  );
}
