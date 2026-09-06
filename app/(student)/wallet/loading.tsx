import { Skeleton } from "@/components/ui/skeleton";

export default function WalletLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      {/* Balance card skeleton */}
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <Skeleton className="mx-auto mb-3 h-3 w-20" />
        <Skeleton className="mx-auto h-12 w-40" />
      </div>

      {/* Add money skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="mb-4 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="mt-4 h-11 w-full rounded-lg" />
      </div>

      {/* Transactions skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="mb-4 h-4 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-14 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
