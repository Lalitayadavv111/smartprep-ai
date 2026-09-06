import { Skeleton } from "@/components/ui/skeleton";

function OrderCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

function ColumnSkeleton({ label }: { label: string }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-6 rounded-full" />
      </div>
      <OrderCardSkeleton />
      <OrderCardSkeleton />
    </section>
  );
}

export default function AdminOrdersLoading() {
  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="size-3 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ColumnSkeleton label="Scheduled" />
        <ColumnSkeleton label="Placed" />
        <ColumnSkeleton label="Preparing" />
        <ColumnSkeleton label="Ready" />
      </div>
    </main>
  );
}
