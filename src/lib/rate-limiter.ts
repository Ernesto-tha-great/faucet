import { Redis } from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

const redisClient = new Redis(process.env.REDIS_URL as string);

export const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "ratelimit",
  points: 5, // Number of requests
  duration: 60 * 60, // Per hour
});

export async function limitRate(ip: string): Promise<boolean> {
  try {
    await rateLimiter.consume(ip);
    return true; // Request allowed
  } catch (rejRes) {
    return false; // Request blocked
  }
}
