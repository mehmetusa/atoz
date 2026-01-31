// lib/keepaQueue.js
import { Queue, Worker, QueueScheduler } from "bullmq";
import IORedis from "ioredis";
import { getDB } from "./mongo.js";
import {
  callKeepaAPI,
  calculateFees,
  estimateShipping,
  calculateRiskMultiplier,
  filterProduct,
  predictPriceCrash
} from "../../../lib/keepaUtils.js";
import { getCachedProduct, setCachedProduct } from "./redis.js";

// Redis connection
const connection = new IORedis(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL, {
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Queue + scheduler
export const keepaQueue = new Queue("keepaQueue", { connection });
new QueueScheduler("keepaQueue", { connection });

// Helper sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Worker
const worker = new Worker(
  "keepaQueue",
  async (job) => {
    const { upc, category, mode = "DE" } = job.data;
    const db = await getDB();

    // Redis duplicate check
    const redisKey = `${upc}:${mode}`;
    let cached = await getCachedProduct(redisKey);
    if (cached) return cached;

    // Fetch US + EU products
    let productUS = await getCachedProduct(`${upc}:US`);
    if (!productUS) productUS = await callKeepaAPI(upc, "US");
    if (!productUS || !filterProduct(productUS)) return null;

    let productEU = await getCachedProduct(`${upc}:${mode}`);
    if (!productEU) productEU = await callKeepaAPI(upc, mode);
    if (!productEU || !filterProduct(productEU)) return null;

    // Filter: rank / hazmat
    if (productUS.hazmat || productEU.hazmat) return null;
    if (productUS.rank > 20000 || productEU.rank > 20000) return null;

    // Fees / shipping / risk
    const fees = await calculateFees(productEU.asin, productEU.buyBoxPrice);
    const shipping = estimateShipping(productUS, productEU);
    const riskMultiplier = calculateRiskMultiplier(
      productUS.upc === productEU.upc,
      productUS.title === productEU.title,
      productUS.variationHash !== productEU.variationHash,
      productUS.hazmat || productEU.hazmat,
      false
    );

    // Opportunity score
    const opportunityScore = (productEU.buyBoxPrice - productUS.usPrice - fees - shipping) * riskMultiplier;

    // Prepare product data for "products" collection
    const productData = {
      upc,
      asin: productEU.asin,
      market: mode,
      category,
      title: productEU.title,
      brand: productEU.brand,
      usPrice: productUS.usPrice,
      euPrice: productEU.buyBoxPrice,
      buyBoxPrice: productEU.buyBoxPrice,
      salesRank: productEU.rank,
      variationHash: productEU.variationHash,
      lastSeen: new Date(),
      status: "shown",
      opportunityScore,
      scannedAt: new Date(),
    };

    // Upsert into "products"
    await db.collection("products").updateOne(
      { upc, market: mode },
      { $set: productData },
      { upsert: true }
    );

    // Cache in Redis 1 hour
    await setCachedProduct(redisKey, productData, 3600);

    // --- PRICE CRASH SCORING ---
    const priceCrash = predictPriceCrash(productEU);

    const opportunityAnalysis = {
      upc,
      asin: productEU.asin,
      category,
      market: mode,
      opportunityScore,
      priceCrashScore: priceCrash.score,
      priceCrashLevel: priceCrash.level,
      lastAnalyzed: new Date(),
    };

    // Auto-rank (example: can be extended)
    const alerts = [];
    if (opportunityScore > 50) alerts.push("High profit opportunity");
    if (priceCrash.score > 0.7) alerts.push("High price crash risk");
    if (productEU.amazonBuyBoxPercent > 80) alerts.push("Buy Box dominated by Amazon");

    opportunityAnalysis.alerts = alerts;

    // Upsert into "opportunities"
    await db.collection("opportunities").updateOne(
      { upc, asin: productEU.asin },
      { $set: opportunityAnalysis },
      { upsert: true }
    );

    // Insert alerts separately
    if (alerts.length > 0) {
      await db.collection("alerts").insertOne({
        upc,
        asin: productEU.asin,
        alerts,
        createdAt: new Date(),
      });
    }

    // Throttle API calls
    await sleep(1200);

    return { productData, opportunityAnalysis };
  },
  { connection, concurrency: 5 }
);

// Producer: add job to queue
export async function addToQueue(upc, category, mode = "DE") {
  const redisKey = `scanned:${upc}:${mode}`;

  // Redis duplicate check
  const exists = await getCachedProduct(redisKey);
  if (exists) return false;

  await keepaQueue.add(
    "scan",
    { upc, category, mode },
    {
      jobId: `keepa:${upc}:${mode}`,
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 3,
      backoff: { type: "exponential", delay: 30000 },
    }
  );

  // Cache as scanned for 14 days
  await setCachedProduct(redisKey, true, 60 * 60 * 24 * 14);

  return true;
}
