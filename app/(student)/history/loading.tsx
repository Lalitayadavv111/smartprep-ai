import { Skeleton } from "@/components/ui/skeleton";

function HistoryRowSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export default function HistoryLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Skeleton className="mb-4 h-8 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <HistoryRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
