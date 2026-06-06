// Server-rendered skeleton — zero JS, paints on the first byte.
// Mirrors the exact layout of the team detail page:
// header row → lg:grid-cols-4 → members sidebar (col-span-1) +
// main content with tab pills + task rows (col-span-3).
import { BirdLandingLoader } from '@/components/BirdsEyeLoader';

export default function Loading() {
  return (
    <div className="pb-12 space-y-5 page-enter max-w-[1440px]" aria-busy="true" aria-live="polite">
      {/* Bird-landing cue */}
      <BirdLandingLoader label="Landing on this team…" />

      {/* ── Header row: team name + action buttons ──────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="space-y-2">
          <div className="skeleton h-7 w-52 rounded" />
          <div className="skeleton h-3.5 w-80 max-w-full rounded" />
          <div className="skeleton h-3 w-32 rounded" />
        </div>
        <div className="shrink-0 flex gap-2">
          <div className="skeleton h-8 w-20 rounded-xl" />
          <div className="skeleton h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* ── 4-col grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Members sidebar (col-span-1) */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
            <div className="skeleton h-3.5 w-28 rounded" />
            {/* 4 member rows: avatar + name */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1 border-b border-slate-100 last:border-b-0">
                <div className="skeleton w-7 h-7 rounded-full shrink-0" style={{ animationDelay: `${i * 40}ms` }} />
                <div className="flex-1 space-y-1">
                  <div className="skeleton h-3 w-28 max-w-full rounded" style={{ animationDelay: `${i * 40 + 20}ms` }} />
                  <div className="skeleton h-2.5 w-16 rounded" style={{ animationDelay: `${i * 40 + 30}ms` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content (col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tab pill row */}
          <div className="flex gap-2">
            <div className="skeleton h-8 w-28 rounded-lg" />
            <div className="skeleton h-8 w-24 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-lg" />
          </div>

          {/* Project progress card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
            <div className="skeleton h-3.5 w-32 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="skeleton h-3 w-1/3 rounded" />
                <div className="skeleton h-2 flex-1 rounded-full" />
                <div className="skeleton h-3 w-14 rounded" />
              </div>
            ))}
          </div>

          {/* Member workload card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
            <div className="skeleton h-3.5 w-28 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-t border-slate-100 pt-2.5" style={{ animationDelay: `${i * 50 + 100}ms` }}>
                <div className="skeleton w-7 h-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="skeleton h-3 w-28 rounded" />
                  <div className="skeleton h-2 w-16 rounded" />
                </div>
                <div className="skeleton h-3 w-8 rounded" />
                <div className="skeleton h-3 w-8 rounded" />
                <div className="skeleton h-2 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
