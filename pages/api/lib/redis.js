// lib/redis.js
import Redis from 'ioredis';
// const redis = new Redis(process.env.REDIS_URL);
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN, // if you have token auth
  });
  
export async function getCachedProduct(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
}

export async function setCachedProduct(key, product) {
    await redis.set(key, JSON.stringify(product), 'EX', 60 * 60 * 24); // 24h
}
