// lib/keepaQueue.js
import Queue from "bull";
import fetch from "node-fetch";
import IORedis from "ioredis";
import { MongoClient } from "mongodb";

// ---- CONFIG ----
const MAX_BATCH = 100; // Keepa API max ASIN per request
const THROTTLE_MS = 1200; // 1.2 sec delay per request
const MAX_RETRY = 3;

// ---- Redis (BullMQ Queue) ----
// Upstash TCP URL kullan, REST ile Bull çalışmaz
const redisConnection = new IORedis(process.env.UPSTASH_REDIS_TCP_URL, { tls: true });
const keepaQueue = new Queue("keepaQueue", {
  redis: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 }
  }
});

// ---- MongoDB ----
let mongoClient;
async function getMongoDB() {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
  }
  return mongoClient.db().collection("products");
}

// ---- Worker ----
keepaQueue.process(async (job) => {
  const { category, asins } = job.data;
  const products = await getMongoDB();

  for (let i = 0; i < asins.length; i += MAX_BATCH) {
    const batch = asins.slice(i, i + MAX_BATCH);

    let attempt = 0;
    while (attempt < MAX_RETRY) {
      try {
        const res = await fetch(
          `https://api.keepa.com/product?key=${process.env.KEEPA_API_KEY}&domain=1&asin=${batch.join(",")}`
        );
        const data = await res.json();

        if (!data.products) throw new Error("Keepa returned no products");

        for (const p of data.products) {
          await products.updateOne({ asin: p.asin }, { $set: p }, { upsert: true });
        }

        await new Promise(r => setTimeout(r, THROTTLE_MS));
        break; // success, exit retry loop

      } catch (err) {
        attempt++;
        console.error(`Keepa request failed. Attempt ${attempt}/${MAX_RETRY}`, err);
        await new Promise(r => setTimeout(r, THROTTLE_MS * attempt)); // exponential backoff
      }
    }
  }

  console.log(`Job completed for category: ${category}, ASINs: ${asins.length}`);
});

// ---- Producer ----
export async function addToQueue(category, asins) {
  await keepaQueue.add("scan", { category, asins });
}


// // lib/keepaQueue.js
// import Queue from 'bull';
// import { getCachedProduct, setCachedProduct } from './redis.js';
// import  { getDB }    from './mongo.js';
// import { callKeepaAPI, calculateFees, estimateShipping, calculateRiskMultiplier, calculateSalesVelocity, calculatePriceStability, calculateCompetitionScore } from './keepaUtils.js';

// const keepaQueue = new Queue('keepaQueue', { redis: { host: 'localhost', port: 6379 } });

// export async function addToQueue(upc, mode, category) {
//     await keepaQueue.add({ upc, mode, category }, { removeOnComplete: true, removeOnFail: true });
// }


