'use client';
import dynamic from 'next/dynamic';

const YearlyView = dynamic(() => import('./YearlyView'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 page-enter">
      <div className="skeleton h-8 w-64" />
      <div className="skeleton h-48 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-8 w-12" />
          </div>
        ))}
      </div>
    </div>
  ),
});

export default function YearlySelfPage() {
  return <YearlyView />;
}
