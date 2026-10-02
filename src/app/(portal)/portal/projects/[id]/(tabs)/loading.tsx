import { PanelSkeleton } from "@/components/portal/Skeleton";

export default function ProjectTabLoading() {
  return (
    <div role="status">
      <span className="sr-only">Loading</span>
      <PanelSkeleton />
    </div>
  );
}
