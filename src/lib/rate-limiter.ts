import { Redis } from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

const redisClient = new Redis(process.env.REDIS_URL as string);

export const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "ratelimit",
  points: 3, // Number of requests
  duration: 3600, //
});

export async function limitRate(ip: string): Promise<boolean> {
  try {
    console.log(`Attempting to consume rate limit for IP: ${ip}`);
    await rateLimiter.consume(ip);
    console.log(`Request allowed for IP: ${ip}`);
    return true; // Request allowed
  } catch (rejRes) {
    console.log(`Request blocked for IP: ${ip}`);
    return false; // Request blocked
  }
}
