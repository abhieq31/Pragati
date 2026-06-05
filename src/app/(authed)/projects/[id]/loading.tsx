import { BirdLandingLoader } from '@/components/BirdsEyeLoader';

export default function Loading() {
  return (
    <div className="pb-12 max-w-[1440px] space-y-5">
      <div className="relative overflow-hidden rounded-[28px] border border-brand-100/70 dark:border-white/10 bg-white dark:bg-[#262624] p-5 sm:p-6 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(21,101,192,0.15),transparent_34%),radial-gradient(circle_at_100%_80%,rgba(46,125,50,0.12),transparent_36%)]" />
        <div className="relative">
          <BirdLandingLoader label="Landing on this project…" />
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="skeleton h-3 w-28 rounded" />
              <div className="skeleton h-9 w-full max-w-xl rounded-xl" />
              <div className="skeleton h-4 w-full max-w-2xl rounded" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-10 w-28 rounded-xl" />
              <div className="skeleton h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="card p-4"><div className="skeleton h-4 w-16 rounded" /><div className="skeleton h-7 w-20 rounded mt-3" /></div>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between"><div className="skeleton h-5 w-40 rounded" /><div className="skeleton h-9 w-28 rounded-xl" /></div>
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-4 space-y-3"><div className="skeleton h-5 w-28 rounded" /><div className="skeleton h-44 w-full rounded-2xl" /></div>
          <div className="card p-4 space-y-3"><div className="skeleton h-5 w-32 rounded" /><div className="skeleton h-24 w-full rounded-2xl" /></div>
        </div>
      </div>
    </div>
  );
}
