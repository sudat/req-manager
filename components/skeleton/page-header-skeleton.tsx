import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="mb-4 space-y-2">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}
