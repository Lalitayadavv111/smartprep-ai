import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "size-5 border-2",
  md: "size-9 border-[3px]",
  lg: "size-12 border-4",
};

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("flex items-center justify-center p-8", className)}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-muted border-t-primary",
          sizeClass[size],
        )}
      />
    </div>
  );
}
