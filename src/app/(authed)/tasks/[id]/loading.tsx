// Server-rendered skeleton — paints instantly while the task detail page
// streams in. No JS, no hydration.
export default function Loading() {
  return (
    <div className="pb-12 max-w-[1100px]">
      <div className="mb-5 space-y-2">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-7 w-1/2 max-w-md" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-3">
          <div className="skeleton h-24 w-full rounded-2xl" />
          <div className="skeleton h-32 w-full rounded-2xl" />
          <div className="skeleton h-40 w-full rounded-2xl" />
        </div>
        <div className="space-y-3">
          <div className="skeleton h-44 w-full rounded-2xl" />
          <div className="skeleton h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
