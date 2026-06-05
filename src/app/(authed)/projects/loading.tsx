import { BirdEyeIcon } from '@/components/BirdEyeIcon';
import { PragatiMark } from '@/components/PragatiMark';

const cards = ['Change control', 'Validation pack', 'CAPA follow-up', 'Release readiness'];

export default function Loading() {
  return (
    <div className="pb-12 max-w-[1120px] space-y-5">
      <div className="relative overflow-hidden rounded-[28px] border border-brand-100/70 dark:border-white/10 bg-white dark:bg-[#262624] shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(21,101,192,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(46,125,50,0.14),transparent_36%)]" />
        <div className="relative p-6 sm:p-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-600 to-forest-600 flex items-center justify-center shadow-lg shadow-brand-700/15">
              <BirdEyeIcon size={34} className="text-white" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-600 dark:text-[#e8a98c]">Projects</div>
              <div className="mt-2 skeleton h-8 w-48 rounded-lg" />
              <div className="mt-2 skeleton h-3.5 w-72 max-w-full rounded" />
            </div>
          </div>
          <div className="hidden sm:block skeleton h-10 w-36 rounded-xl" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 dark:border-white/10">
        {['Active', 'Completed', 'Archived'].map((tab, i) => (
          <div key={tab} className={`h-8 rounded-t-xl px-4 flex items-center ${i === 0 ? 'bg-brand-50 dark:bg-white/[0.06]' : ''}`}>
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      <div className="card p-4 min-h-[76px] flex items-center gap-3">
        <div className="skeleton h-10 flex-1 rounded-xl" />
        <div className="hidden md:block skeleton h-10 w-32 rounded-xl" />
        <div className="hidden md:block skeleton h-10 w-28 rounded-xl" />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {cards.map((label, i) => (
          <div key={label} className="card p-5 space-y-4 overflow-hidden relative">
            <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-gradient-to-br from-brand-100/70 to-forest-100/70 dark:from-white/[0.06] dark:to-white/[0.02]" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-white/25">{label}</div>
                <div className="skeleton h-5 w-3/4 rounded" />
              </div>
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="skeleton h-2 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((n) => <div key={n} className="skeleton h-12 rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-semibold text-slate-400 dark:text-white/35">
        <PragatiMark size={20} flat /> Preparing your project landscape…
      </div>
    </div>
  );
}
