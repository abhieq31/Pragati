// Server-rendered skeleton — paints instantly while the project detail page
// streams in. Leads with the bird-landing cue (swooping from the bird's-eye
// dashboard down into this single project), then the content skeleton.
import { BirdLandingLoader } from '@/components/BirdsEyeLoader';

export default function Loading() {
  return (
    <div className="pb-12 max-w-[1440px]">
      <BirdLandingLoader label="Landing on this project…" />
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
