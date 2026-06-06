// Server-rendered skeleton — zero JS, paints on the first byte while the
// project page streams in. Mirrors the exact visual structure of the real
// page: header row → 4 stat cards → 5-column kanban preview.
import { BirdLandingLoader } from '@/components/BirdsEyeLoader';

const COLUMNS = [
  { w: 56, label: 'To Do' },
  { w: 72, label: 'In Progress' },
  { w: 48, label: 'Review' },
  { w: 40, label: 'Blocked' },
  { w: 52, label: 'Done' },
];

export default function Loading() {
  return (
    <div className="pb-12 page-enter max-w-[1440px]" aria-busy="true" aria-live="polite">
      {/* Bird-landing cue */}
      <BirdLandingLoader label="Landing on this project…" />

      {/* ── Header row: title + status pills + action buttons ──────── */}
      <div className="mb-5 space-y-2">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-7 w-72 max-w-full rounded" />
        <div className="flex gap-2 mt-2 flex-wrap">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-24 rounded-full" />
        </div>
      </div>

      {/* ── 4 stat cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[['Progress', '—%'], ['Tasks', '—'], ['Overdue', '—'], ['Waiting', '—']].map(([label]) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-7 w-10 rounded" />
          </div>
        ))}
      </div>

      {/* ── Kanban columns ──────────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-hidden pb-3">
        {COLUMNS.map(({ label, w }) => (
          <div
            key={label}
            className="shrink-0 rounded-xl border-2 border-slate-100 bg-slate-50/60 p-3 space-y-2.5"
            style={{ width: 230 }}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-1">
              <div className={`skeleton h-3 w-${w < 48 ? 14 : w < 64 ? 20 : 24} rounded`} />
              <div className="skeleton h-4 w-5 rounded-full" />
            </div>
            {/* 1–2 card placeholders */}
            <div className="skeleton h-16 w-full rounded-lg" />
            {label !== 'Blocked' && label !== 'Done' && (
              <div className="skeleton h-12 w-full rounded-lg" style={{ animationDelay: '80ms' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
