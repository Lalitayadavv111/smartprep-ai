import { Skeleton } from "@/components/ui/skeleton";

function MenuItemSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-[#92400E]/15 bg-white/80"
      style={{
        background: "linear-gradient(90deg, #F5EBE0 25%, #FDF6EE 50%, #F5EBE0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.8s ease-in-out infinite",
      }}
    >
      <Skeleton className="h-[100px] w-full rounded-none rounded-t-xl bg-[#E8D5C4]" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-5 w-4/5 bg-[#E8D5C4]" />
        <Skeleton className="h-4 w-full bg-[#EAD9CC]" />
        <Skeleton className="h-4 w-2/3 bg-[#EAD9CC]" />
        <div className="mt-2 flex items-center justify-between gap-2 pt-1">
          <Skeleton className="h-6 w-16 bg-[#E8D5C4]" />
          <Skeleton className="h-7 w-14 rounded-lg bg-[#F97316]/20" />
        </div>
      </div>
    </div>
  );
}

export default function MenuLoading() {
  return (
    <div className="p-4 pb-10">
      <div className="mb-4 space-y-2">
        <Skeleton className="h-8 w-36 bg-[#E8D5C4]" />
        <Skeleton className="h-4 w-44 bg-[#EAD9CC]" />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full bg-[#E8D5C4]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MenuItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

