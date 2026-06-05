import { TeamsListSkeleton } from '@/components/SkeletonScreens';

const teams = ['RTB operations', 'CTB delivery', 'Validation squad', 'Quality review'];

export default function Loading() {
  return <TeamsListSkeleton />;
}
