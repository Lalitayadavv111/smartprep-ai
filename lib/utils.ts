import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind class merge helper (shadcn/ui). Server auth/response helpers live in `@/lib/server-api`. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
