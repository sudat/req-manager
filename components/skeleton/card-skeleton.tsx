import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <Card className="h-80 rounded-md border border-slate-200/60 bg-white">
      <CardContent className="p-0">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="px-4 py-2 border-b border-slate-100">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="px-4 py-2 border-b border-slate-100">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <div className="px-4 py-2.5 border-b border-slate-100">
          <Skeleton className="h-3 w-20 mb-1.5" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
        </div>
        <div className="px-4 py-2.5 border-b border-slate-100">
          <Skeleton className="h-3 w-20 mb-1.5" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <div className="px-4 py-2.5">
          <Skeleton className="h-3 w-24 mb-1.5" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
