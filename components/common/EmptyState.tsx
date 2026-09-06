import Link from "next/link";

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <span className="text-5xl" aria-hidden>
        {icon}
      </span>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-white transition-colors bg-[#F97316] hover:bg-[#ea580c]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
