"use client";

import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminOrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center md:p-6">
      <AlertCircleIcon className="size-12 text-destructive" aria-hidden />
      <h2 className="text-lg font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">{error.message}</p>
      <Button
        type="button"
        onClick={reset}
        className="bg-orange-500 text-white hover:bg-orange-600"
      >
        Try again
      </Button>
    </main>
  );
}
