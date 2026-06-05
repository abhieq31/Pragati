import { ProjectsListSkeleton } from '@/components/SkeletonScreens';

const cards = ['Change control', 'Validation pack', 'CAPA follow-up', 'Release readiness'];

export default function Loading() {
  return <ProjectsListSkeleton />;
}
