// lib/keepaQueue.js
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { getCachedProduct, setCachedProduct } from "./redis.js";
import { getDB } from "./mongo.js";
import {
  callKeepaAPI,
  calculateFees,
  estimateShipping,
  calculateRiskMultiplier,
  calculateSalesVelocity,
  calculatePriceStability,
  calculateCompetitionScore
} from "./keepaUtils.js";

// Redis connection (local OR Upstash/ElastiCache)
const connection = new IORedis(process.env.REDIS_URL || {
  host: "127.0.0.1",
  port: 6379
});

// Queue (producer only – safe for Next.js API routes)
export const keepaQueue = new Queue("keepaQueue", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    }
  }
});

// Same API as before
export async function addToQueue(upc, mode, category) {
  await keepaQueue.add("scan", {
    upc,
    mode,
    category
  });
}


// import Queue from 'bull';
// import { getCachedProduct, setCachedProduct } from './redis.js';

// export const keepaQueue = new Queue('keepaQueue', {
//   redis: { host: '127.0.0.1', port: 6379 }
// });

// export async function addToQueue(upc, category) {
//   if(await getCachedProduct(upc)) return; // duplicate check
//   await keepaQueue.add({ upc, category }, { removeOnComplete: true, removeOnFail: true });
// }


// lib/keepaQueue.js
// import Queue from 'bull';
// import { getCachedProduct, setCachedProduct } from './redis.js';
// import { getDB } from './mongo.js';
// import { callKeepaAPI, calculateFees, estimateShipping, calculateRiskMultiplier, calculateSalesVelocity, calculatePriceStability, calculateCompetitionScore } from './keepaUtils.js';

// const keepaQueue = new Queue('keepaQueue', { redis: { host: 'localhost', port: 6379 } });

// export async function addToQueue(upc, mode, category) {
//     await keepaQueue.add({ upc, mode, category }, { removeOnComplete: true, removeOnFail: true });
// }
