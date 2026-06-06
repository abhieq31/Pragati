// Server-rendered skeleton — zero JS, paints on the first byte.
// Mirrors the exact People directory layout: header with Add button, search
// bar, then user rows (avatar circle + name/role + actions).
export default function Loading() {
  return (
    <div className="pb-12 max-w-[1200px] page-enter" aria-busy="true" aria-live="polite">

      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
        <div className="space-y-2">
          <div className="skeleton h-8 w-24 rounded" />
          <div className="skeleton h-3 w-56 max-w-full rounded" />
        </div>
        <div className="skeleton h-9 w-28 rounded-xl" />
      </div>

      {/* ── Search + filter row ─────────────────────────────────────── */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="skeleton h-9 flex-1 min-w-[180px] rounded-xl" />
        <div className="skeleton h-9 w-28 rounded-xl" />
        <div className="skeleton h-9 w-28 rounded-xl" />
      </div>

      {/* ── Section label ───────────────────────────────────────────── */}
      <div className="skeleton h-3 w-20 rounded mb-3" />

      {/* ── User rows: avatar + name/email block + role badge + action buttons */}
      <div className="space-y-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3"
            style={{ animationDelay: `${i * 35}ms` }}
          >
            {/* Avatar circle */}
            <div className="skeleton w-9 h-9 rounded-full shrink-0" />

            {/* Name + email block */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="skeleton h-3.5 w-36 max-w-full rounded" />
              <div className="skeleton h-2.5 w-48 max-w-full rounded" />
            </div>

            {/* Role badge */}
            <div className="skeleton h-5 w-20 rounded-full hidden sm:block" />

            {/* Action icon buttons */}
            <div className="flex gap-1.5 shrink-0">
              <div className="skeleton h-7 w-7 rounded-lg" />
              <div className="skeleton h-7 w-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
