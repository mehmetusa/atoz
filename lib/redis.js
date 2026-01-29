// lib/redis.js
import { Redis } from "@upstash/redis";

// Upstash REST URL ve token kullan
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN, // sadece REST token varsa
});

// Redis’ten product al
export async function getCachedProduct(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis get error:", err);
    return null;
  }
}

// Redis’e product kaydet
export async function setCachedProduct(key, value, ttlSeconds = 3600) {
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch (err) {
    console.error("Redis set error:", err);
  }
}

export default redis;
