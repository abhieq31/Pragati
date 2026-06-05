import { Users } from 'lucide-react';
import { PragatiMark } from '@/components/PragatiMark';

const teams = ['RTB operations', 'CTB delivery', 'Validation squad', 'Quality review'];

export default function Loading() {
  return (
    <div className="pb-12 max-w-[1120px] space-y-5">
      <div className="relative overflow-hidden rounded-[28px] border border-forest-100/80 dark:border-white/10 bg-white dark:bg-[#262624] shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(46,125,50,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(21,101,192,0.13),transparent_38%)]" />
        <div className="relative p-6 sm:p-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-forest-600 to-brand-600 flex items-center justify-center shadow-lg shadow-forest-700/15">
              <Users size={30} className="text-white" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-forest-700 dark:text-[#9fdea8]">Teams</div>
              <div className="mt-2 skeleton h-8 w-40 rounded-lg" />
              <div className="mt-2 skeleton h-3.5 w-72 max-w-full rounded" />
            </div>
          </div>
          <div className="hidden sm:block skeleton h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="card p-4 min-h-[76px] flex items-center gap-3">
        <div className="skeleton h-10 flex-1 rounded-xl" />
        <div className="hidden md:block skeleton h-10 w-36 rounded-xl" />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {teams.map((label, i) => (
          <div key={label} className="card p-5 space-y-4 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-forest-100/60 dark:bg-white/[0.04]" />
            <div className="relative flex items-start gap-3">
              <div className="skeleton w-12 h-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-white/25">{label}</div>
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-5 w-24 rounded-full" />
              </div>
            </div>
            <div className="flex -space-x-2">
              {[0, 1, 2, 3, 4].map((j) => (
                <div key={j} className="skeleton w-8 h-8 rounded-full ring-2 ring-white dark:ring-[#262624]" />
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-semibold text-slate-400 dark:text-white/35">
        <PragatiMark size={20} flat /> Aligning teams and contributors…
      </div>
    </div>
  );
}
