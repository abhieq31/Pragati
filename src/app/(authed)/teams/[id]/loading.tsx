import { Users } from 'lucide-react';
import { BirdLandingLoader } from '@/components/BirdsEyeLoader';

export default function Loading() {
  return (
    <div className="pb-12 max-w-[1440px] space-y-5">
      <div className="relative overflow-hidden rounded-[28px] border border-forest-100/80 dark:border-white/10 bg-white dark:bg-[#262624] p-5 sm:p-6 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(46,125,50,0.16),transparent_34%),radial-gradient(circle_at_100%_85%,rgba(21,101,192,0.12),transparent_38%)]" />
        <div className="relative">
          <BirdLandingLoader label="Landing on this team…" />
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-forest-600 to-brand-600 flex items-center justify-center shadow-lg shadow-forest-700/15">
                <Users size={30} className="text-white" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="skeleton h-3 w-28 rounded" />
                <div className="skeleton h-9 w-full max-w-lg rounded-xl" />
                <div className="skeleton h-4 w-full max-w-xl rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-10 w-28 rounded-xl" />
              <div className="skeleton h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['Overview', 'Projects', 'Members'].map((tab) => <div key={tab} className="skeleton h-9 w-28 rounded-xl" />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between"><div className="skeleton h-5 w-36 rounded" /><div className="skeleton h-9 w-28 rounded-xl" /></div>
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-4 space-y-3"><div className="skeleton h-5 w-28 rounded" /><div className="flex -space-x-2">{[0,1,2,3,4,5].map(i => <div key={i} className="skeleton h-9 w-9 rounded-full ring-2 ring-white dark:ring-[#262624]" />)}</div><div className="skeleton h-32 w-full rounded-2xl" /></div>
          <div className="card p-4 space-y-3"><div className="skeleton h-5 w-32 rounded" /><div className="skeleton h-24 w-full rounded-2xl" /></div>
        </div>
      </div>
    </div>
  );
}
