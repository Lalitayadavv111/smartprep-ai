import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { apiError } from "@/lib/server-api";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const walletLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "noq:wallet",
});

export const orderLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  prefix: "noq:order",
});

export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "noq:auth",
});

export async function checkRateLimit(
  limiter: Pick<Ratelimit, "limit">,
  identifier: string,
): Promise<void> {
  const { success } = await limiter.limit(identifier);
  if (!success) {
    throw apiError("Too many requests", 429, "RATE_LIMITED");
  }
}
