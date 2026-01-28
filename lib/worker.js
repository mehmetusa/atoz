import Queue from "bull";
import fetch from "node-fetch";
import Redis from "ioredis";
import { MongoClient } from "mongodb";

// Redis & Queue
const redis = new Redis(process.env.REDIS_URL);
const keepaQueue = new Queue("keepaQueue", { redis: { host: redis.options.host, port: 6379 } });

// MongoDB
const client = new MongoClient(process.env.MONGO_URI);
await client.connect();
const db = client.db();
const products = db.collection("products");

// Config
const MAX_BATCH = 100; // Keepa API max ASIN per request
const THROTTLE_MS = 1200; // 1.2 sec delay per request
const MAX_RETRY = 3;

// Worker
keepaQueue.process(async (job) => {
  const { category, asins } = job.data;

  // Batch ASINs
  for (let i = 0; i < asins.length; i += MAX_BATCH) {
    const batch = asins.slice(i, i + MAX_BATCH);

    let attempt = 0;
    while (attempt < MAX_RETRY) {
      try {
        // Keepa API request
        const res = await fetch(`https://api.keepa.com/product?key=${process.env.KEEPA_API_KEY}&domain=1&asin=${batch.join(",")}`);
        const data = await res.json();

        // MongoDB upsert
        for (const p of data.products) {
          await products.updateOne({ asin: p.asin }, { $set: p }, { upsert: true });
        }

        // Throttle
        await new Promise(r => setTimeout(r, THROTTLE_MS));
        break; // success, exit retry loop

      } catch (err) {
        attempt++;
        console.log(`Keepa request failed. Attempt ${attempt} / ${MAX_RETRY}`, err);
        await new Promise(r => setTimeout(r, THROTTLE_MS * attempt)); // exponential backoff
      }
    }
  }

  console.log(`Job completed for category: ${category}, ASINs: ${asins.length}`);
});


// // lib/keepaQueue.js
// import Queue from 'bull';
// import { getCachedProduct, setCachedProduct } from './redis.js';
// import { getDB } from './mongo.js';
// import { callKeepaAPI, calculateFees, estimateShipping, calculateRiskMultiplier, calculateSalesVelocity, calculatePriceStability, calculateCompetitionScore } from './keepaUtils.js';

// const keepaQueue = new Queue('keepaQueue', { redis: { host: 'localhost', port: 6379 } });

// export async function addToQueue(upc, mode, category) {
//     await keepaQueue.add({ upc, mode, category }, { removeOnComplete: true, removeOnFail: true });
// }


