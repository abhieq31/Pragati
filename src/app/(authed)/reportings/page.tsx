'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client/api';
import { Avatar, Card, EmptyState, ProgressBar } from '@/components/ui';
import { Users, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

interface Reporting {
  id: string;
  name: string;
  email: string;
  title?: string;
  role: string;
  metrics: {
    assigned: number;
    done: number;
    open: number;
    overdue: number;
    dueThisWeek: number;
    gxpOpen: number;
    closedLast7: number;
    completionRate: number;
  };
}

export default function ReportingsPage() {
  const [data, setData] = useState<{ reportings: Reporting[] } | null>(null);

  useEffect(() => {
    api<{ reportings: Reporting[] }>('/me/reportings').then(setData);
  }, []);

  if (!data) return <div className="text-slate-500">Loading…</div>;

  const { reportings } = data;

  if (reportings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My reportings</h1>
          <p className="text-sm text-slate-500">
            Everyone who reports to you, and what they&apos;re working on.
          </p>
        </div>
        <Card>
          <EmptyState
            title="No direct reports yet"
            hint="Ask your admin to set up the reporting lines — each user has a reports-to field. Once set, you'll see a card per person here with their open / overdue / high-risk counts and drill-through to their task list."
          />
        </Card>
      </div>
    );
  }

  const totals = reportings.reduce(
    (a, r) => ({
      open: a.open + r.metrics.open,
      overdue: a.overdue + r.metrics.overdue,
      gxpOpen: a.gxpOpen + r.metrics.gxpOpen,
      closedLast7: a.closedLast7 + r.metrics.closedLast7
    }),
    { open: 0, overdue: 0, gxpOpen: 0, closedLast7: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-brand-600" size={24} />
          My reportings
        </h1>
        <p className="text-sm text-slate-500">
          {reportings.length} {reportings.length === 1 ? 'person reports' : 'people report'} to you — here&apos;s what&apos;s on their plate.
        </p>
      </div>

      {/* top-line numbers for the whole reporting line */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Open tasks (all)</div>
          <div className="text-3xl font-semibold mt-1">{totals.open}</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overdue</div>
          <div className={`text-3xl font-semibold mt-1 ${totals.overdue ? 'text-red-600' : ''}`}>
            {totals.overdue}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">GxP open</div>
          <div className={`text-3xl font-semibold mt-1 ${totals.gxpOpen ? 'text-amber-600' : ''}`}>
            {totals.gxpOpen}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Closed last 7 days
          </div>
          <div className="text-3xl font-semibold mt-1 text-emerald-600">
            {totals.closedLast7}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportings.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start gap-3">
              <Avatar name={r.name} size={44} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{r.name}</div>
                    <div className="text-xs text-slate-500 truncate">{r.title || r.role}</div>
                  </div>
                  <Link
                    href={`/yearly/${r.id}`}
                    className="text-xs text-brand-700 hover:underline whitespace-nowrap"
                  >
                    Year →
                  </Link>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                  <Metric label="Open" value={r.metrics.open} />
                  <Metric
                    label="Overdue"
                    value={r.metrics.overdue}
                    tone={r.metrics.overdue ? 'bad' : undefined}
                    icon={r.metrics.overdue ? <AlertTriangle size={10} /> : undefined}
                  />
                  <Metric
                    label="Due this wk"
                    value={r.metrics.dueThisWeek}
                    tone={r.metrics.dueThisWeek ? 'warn' : undefined}
                    icon={<Calendar size={10} />}
                  />
                  <Metric
                    label="Closed 7d"
                    value={r.metrics.closedLast7}
                    tone={r.metrics.closedLast7 ? 'good' : undefined}
                    icon={<CheckCircle2 size={10} />}
                  />
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Completion rate</span>
                    <span>{r.metrics.completionRate}%</span>
                  </div>
                  <ProgressBar value={r.metrics.completionRate} />
                </div>

                {r.metrics.gxpOpen > 0 && (
                  <div className="mt-2 text-xs text-amber-700">
                    {r.metrics.gxpOpen} GxP-critical open
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  icon
}: {
  label: string;
  value: number;
  tone?: 'good' | 'warn' | 'bad';
  icon?: React.ReactNode;
}) {
  const toneCls =
    tone === 'bad'
      ? 'text-red-600'
      : tone === 'warn'
        ? 'text-amber-700'
        : tone === 'good'
          ? 'text-emerald-600'
          : 'text-slate-900';
  return (
    <div className="bg-slate-50 rounded px-2 py-1.5">
      <div className="text-[10px] text-slate-500 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={`font-semibold ${toneCls}`}>{value}</div>
    </div>
  );
}
