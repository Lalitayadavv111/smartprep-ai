import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OrderStatus = 'placed' | 'preparing' | 'ready' | 'collected' | 'cancelled' | 'scheduled'

type StatusBadgeProps = {
  status: OrderStatus;
};

const styles: Record<
  OrderStatus,
  { className: string; label: string; pulse?: boolean }
> = {
  placed: {
    className:
      "border-transparent bg-[var(--status-placed)] text-white hover:bg-[var(--status-placed)]",
    label: "Placed",
  },
  preparing: {
    className:
      "border-transparent bg-[var(--status-preparing)] text-amber-950 hover:bg-[var(--status-preparing)]",
    label: "Preparing",
  },
  ready: {
    className:
      "border-transparent bg-[var(--status-ready)] text-white hover:bg-[var(--status-ready)]",
    label: "Ready",
    pulse: true,
  },
  collected: {
    className:
      "border-transparent bg-[var(--status-collected)] text-white hover:bg-[var(--status-collected)]",
    label: "Collected",
  },
  cancelled: {
    className:
      "border-transparent bg-[var(--status-cancelled)] text-white hover:bg-[var(--status-cancelled)]",
    label: "Cancelled",
  },
  scheduled: {
    className:
      "border-transparent bg-blue-500 text-white hover:bg-[#3D2B1F]",
    label: "Scheduled",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = styles[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5", cfg.className)}>
      {cfg.pulse ? (
        <span
          className="size-1.5 animate-pulse rounded-full bg-white/90"
          aria-hidden
        />
      ) : null}
      {cfg.label}
    </Badge>
  );
}
