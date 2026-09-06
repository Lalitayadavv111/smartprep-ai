"use client";

import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WalletError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="flex flex-col items-center gap-4 py-16 text-center">
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
      </div>
    </div>
  );
}
