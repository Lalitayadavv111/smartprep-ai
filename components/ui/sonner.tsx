"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset="70px"
      className="toaster group"
      toastOptions={{
        duration: 1500,
        classNames: {
          toast:
            "group toast border-border bg-card text-card-foreground shadow-lg pointer-events-none",
          title: "text-foreground",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}