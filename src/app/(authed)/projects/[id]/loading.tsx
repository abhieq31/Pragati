// Server-rendered skeleton — paints instantly while the project detail page
// streams in. No JS, no hydration.
export default function Loading() {
  return (
    <div className="pb-12 max-w-[1440px]">
      <div className="mb-6 space-y-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-2/3 max-w-lg" />
        <div className="skeleton h-3 w-3/4 max-w-xl" />
      </div>
      <div className="flex gap-2 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-7 w-24 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}
        </div>
        <div className="space-y-3">
          <div className="skeleton h-48 w-full rounded-2xl" />
          <div className="skeleton h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
