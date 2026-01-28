// lib/redis.js
import { Redis } from "@upstash/redis";

// Use the REST URL from env
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN, // if you have token auth
});

// Get product from Redis cache
export async function getCachedProduct(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

// Set product in Redis cache
export async function setCachedProduct(key, value, ttlSeconds = 3600) {
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
}

export default redis;
