// Server-rendered skeleton — paints instantly while the task detail page
// streams in. Leads with the bird-landing cue, then the content skeleton.
import { BirdLandingLoader } from '@/components/BirdsEyeLoader';

export default function Loading() {
  return (
    <div className="pb-12 max-w-[1100px]">
      <BirdLandingLoader label="Landing on this task…" />
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
