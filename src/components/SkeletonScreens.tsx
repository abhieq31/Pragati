/**
 * LinkedIn-style skeleton screens.
 *
 * These are intentionally quiet: no spinner, no brand animation, no fake copy.
 * The blocks mirror the page structure that is about to load, which gives the
 * eye a stable layout immediately and prevents the content from jumping when the
 * server payload arrives.
 */
function Skel({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

function HeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
      <div className="space-y-2 min-w-0 flex-1">
        <Skel className="h-8 w-44 rounded-lg" />
        <Skel className="h-3.5 w-80 max-w-full rounded" />
      </div>
      {action && <Skel className="h-10 w-32 rounded-xl" />}
    </div>
  );
}

function ToolbarSkeleton({ filters = 2 }: { filters?: number }) {
  return (
    <div className="card p-4 min-h-[74px] flex items-center gap-3">
      <Skel className="h-10 flex-1 rounded-xl" />
      {Array.from({ length: filters }).map((_, i) => (
        <Skel key={i} className="hidden md:block h-10 w-28 rounded-xl" />
      ))}
    </div>
  );
}

function StatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <Skel className="h-3 w-16 rounded" />
          <Skel className="h-7 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function CardGridSkeleton({ count = 4, avatar = false }: { count?: number; avatar?: boolean }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-4">
          <div className="flex items-start gap-3">
            {avatar && <Skel className="h-12 w-12 rounded-full shrink-0" />}
            <div className="space-y-2 flex-1 min-w-0">
              <Skel className="h-3 w-24 rounded" />
              <Skel className="h-5 w-3/4 rounded" />
            </div>
            <Skel className="h-6 w-20 rounded-full" />
          </div>
          <Skel className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((n) => <Skel key={n} className="h-10 rounded-xl" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function RowListSkeleton({ count = 8, avatar = false, tall = false }: { count?: number; avatar?: boolean; tall?: boolean }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`card px-4 ${tall ? 'py-4' : 'py-3'}`}>
          <div className="flex items-center gap-3">
            {avatar && <Skel className="h-10 w-10 rounded-full shrink-0" />}
            <div className="space-y-2 flex-1 min-w-0">
              <Skel className="h-4 w-3/4 max-w-[420px] rounded" />
              <Skel className="h-3 w-1/2 max-w-[260px] rounded" />
            </div>
            <Skel className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TabsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-2 border-b border-slate-100 dark:border-white/10">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-8 rounded-t-xl px-4 flex items-center">
          <Skel className="h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

function DetailHeaderSkeleton() {
  return (
    <div className="card p-5 sm:p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-3 flex-1 min-w-0">
          <Skel className="h-3 w-28 rounded" />
          <Skel className="h-9 w-full max-w-xl rounded-xl" />
          <Skel className="h-4 w-full max-w-2xl rounded" />
        </div>
        <div className="flex gap-2">
          <Skel className="h-10 w-28 rounded-xl" />
          <Skel className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function DetailTwoColumnSkeleton({ rows = 4, sidebarAvatar = false }: { rows?: number; sidebarAvatar?: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5">
      <div className="space-y-4 min-w-0">
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Skel className="h-5 w-40 rounded" />
            <Skel className="h-9 w-28 rounded-xl" />
          </div>
          {Array.from({ length: rows }).map((_, i) => <Skel key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      </div>
      <div className="space-y-4">
        <div className="card p-4 space-y-3">
          <Skel className="h-5 w-28 rounded" />
          {sidebarAvatar && (
            <div className="flex -space-x-2 py-1">
              {Array.from({ length: 6 }).map((_, i) => <Skel key={i} className="h-9 w-9 rounded-full ring-2 ring-white dark:ring-[#262624]" />)}
            </div>
          )}
          <Skel className="h-36 w-full rounded-2xl" />
        </div>
        <div className="card p-4 space-y-3">
          <Skel className="h-5 w-32 rounded" />
          <Skel className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="pb-12 max-w-[1440px] space-y-5" role="status" aria-label="Loading dashboard">
      <div className="space-y-3">
        <Skel className="h-9 w-72 max-w-full rounded-xl" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => <Skel key={i} className="h-8 w-28 rounded-lg" />)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Skel className="h-4 w-44 rounded" />
            <Skel className="h-4 w-24 rounded" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skel className="h-4 w-4 rounded-full" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skel className="h-5 w-3/4 rounded" />
                  <Skel className="h-3 w-1/2 rounded" />
                </div>
                <Skel className="h-2 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </section>
        <aside className="space-y-4 lg:pt-[31px]">
          {[0, 1].map((panel) => (
            <div key={panel} className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <Skel className="h-4 w-28 rounded" />
                <Skel className="h-3 w-10 rounded" />
              </div>
              <div className="p-4 space-y-3">
                {[0, 1, 2].map((row) => <Skel key={row} className="h-10 w-full rounded-xl" />)}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

export function ProjectsListSkeleton() {
  return (
    <div className="pb-12 max-w-[1120px] space-y-5" role="status" aria-label="Loading projects">
      <HeaderSkeleton />
      <TabsSkeleton />
      <ToolbarSkeleton filters={2} />
      <CardGridSkeleton />
    </div>
  );
}

export function TeamsListSkeleton() {
  return (
    <div className="pb-12 max-w-[1120px] space-y-5" role="status" aria-label="Loading teams">
      <HeaderSkeleton />
      <ToolbarSkeleton filters={1} />
      <CardGridSkeleton avatar />
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="pb-12 max-w-[1440px] space-y-5" role="status" aria-label="Loading project">
      <DetailHeaderSkeleton />
      <StatCards />
      <DetailTwoColumnSkeleton rows={4} />
    </div>
  );
}

export function TeamDetailSkeleton() {
  return (
    <div className="pb-12 max-w-[1440px] space-y-5" role="status" aria-label="Loading team">
      <DetailHeaderSkeleton />
      <TabsSkeleton />
      <DetailTwoColumnSkeleton rows={4} sidebarAvatar />
    </div>
  );
}

export function TaskDetailSkeleton() {
  return (
    <div className="pb-12 max-w-[1100px] space-y-5" role="status" aria-label="Loading task">
      <DetailHeaderSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5">
        <div className="space-y-4 min-w-0">
          <div className="card p-4 space-y-3"><Skel className="h-5 w-40 rounded" /><Skel className="h-24 w-full rounded-2xl" /></div>
          <div className="card p-4 space-y-3"><Skel className="h-5 w-32 rounded" /><Skel className="h-32 w-full rounded-2xl" /></div>
          <div className="card p-4 space-y-3"><Skel className="h-5 w-36 rounded" /><Skel className="h-40 w-full rounded-2xl" /></div>
        </div>
        <div className="space-y-4">
          <div className="card p-4 space-y-3"><Skel className="h-5 w-28 rounded" /><Skel className="h-36 w-full rounded-2xl" /></div>
          <div className="card p-4 space-y-3"><Skel className="h-5 w-24 rounded" /><Skel className="h-20 w-full rounded-2xl" /></div>
        </div>
      </div>
    </div>
  );
}

export function MyDaySkeleton() {
  return (
    <div className="pb-12 max-w-3xl" role="status" aria-label="Loading My Day">
      <HeaderSkeleton action={false} />
      <div className="card p-3 mb-5"><Skel className="h-10 w-full rounded-xl" /></div>
      <RowListSkeleton count={7} tall />
    </div>
  );
}

export function PeopleSkeleton() {
  return (
    <div className="pb-12 max-w-[1200px]" role="status" aria-label="Loading people">
      <HeaderSkeleton />
      <RowListSkeleton count={9} avatar />
    </div>
  );
}

export function AuditSkeleton() {
  return (
    <div className="max-w-5xl space-y-5 pb-12" role="status" aria-label="Loading audit log">
      <HeaderSkeleton action={false} />
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => <Skel key={i} className="h-7 w-20 rounded-full" />)}
      </div>
      <RowListSkeleton count={10} />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="pb-12 max-w-4xl" role="status" aria-label="Loading settings">
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-4">
          <Skel className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skel className="h-7 w-48 rounded-lg" />
            <Skel className="h-3.5 w-72 max-w-full rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5">
        <div className="space-y-4">
          <div className="card p-4 space-y-3"><Skel className="h-5 w-32 rounded" /><Skel className="h-40 w-full rounded-2xl" /></div>
          <div className="card p-4 space-y-3"><Skel className="h-5 w-36 rounded" /><Skel className="h-56 w-full rounded-2xl" /></div>
        </div>
        <div className="space-y-4">
          <div className="card p-4 space-y-3"><Skel className="h-5 w-28 rounded" /><Skel className="h-32 w-full rounded-2xl" /></div>
          <div className="card p-4 space-y-3"><Skel className="h-5 w-24 rounded" /><Skel className="h-20 w-full rounded-2xl" /></div>
        </div>
      </div>
    </div>
  );
}
