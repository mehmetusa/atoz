// pages/api/startCategoryScan.js
import { addToQueue } from "../../lib/keepaQueue.js";
import { getDB } from "../../lib/mongo.js";
import { callKeepaCategoryAPI } from "../../lib/keepaUtils.js";
import { getCachedProduct, setCachedProduct } from "../../lib/redis.js";

// Configurable filters
const RANK_LIMITS = { electronics: 5000, toys: 20000, home: 10000, books: 30000 };
const HAZMAT_FILTER = true;
const BRAND_WHITELIST = ["Nike", "Adidas", "Apple", "Sony", "LEGO", "Samsung"];
const BRAND_BLACKLIST = ["FakeBrand", "NoName"];
const MAX_BATCH = 100;
const THROTTLE_MS = 1200;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    category,
    brandWhitelist = BRAND_WHITELIST,
    brandBlacklist = BRAND_BLACKLIST,
    maxWeight = 10000,
    maxSize = 100,
    allowAmazonBuyBox = false
  } = req.body;

  if (!category) return res.status(400).json({ error: "Category required" });

  try {
    const db = await getDB();

    // 1️⃣ Pull category products from Keepa API
    const productsUS = await callKeepaCategoryAPI(category, { domain: "com" });

    if (!productsUS || productsUS.length === 0) {
      return res.status(200).json({ message: "No products found for this category." });
    }

    let queuedCount = 0;

    // 2️⃣ Process in batches to save Keepa token
    for (let i = 0; i < productsUS.length; i += MAX_BATCH) {
      const batch = productsUS.slice(i, i + MAX_BATCH);

      for (const p of batch) {
        const brand = p.brand?.toLowerCase() || "";
        const redisKey = `${p.upc}:US`;

        // Duplicate check Redis & Mongo
        const cached = await getCachedProduct(redisKey);
        const inMongo = await db.collection("products").findOne({ upc: p.upc });
        if (cached || inMongo) continue;

        // Brand filter
        if (brandBlacklist.length && brandBlacklist.includes(brand)) continue;
        if (brandWhitelist.length && brandWhitelist.length > 0 && !brandWhitelist.includes(brand)) continue;

        // Weight & size filter
        const weight = p.weight || 0;
        const size = p.size || 0;
        if (weight > maxWeight || size > maxSize) continue;

        // Hazmat filter
        if (HAZMAT_FILTER && p.hazmat) continue;

        // Rank filter
        if (p.rank > (RANK_LIMITS[category] || 20000)) continue;

        // Buy Box ownership
        const buyBoxSeller = p.buyBoxSellerId || "";
        const isAmazonOwned = buyBoxSeller.toLowerCase() === "amazon";
        if (!allowAmazonBuyBox && isAmazonOwned) continue;

        // Save to Mongo
        await db.collection("products").updateOne(
          { upc: p.upc },
          {
            $set: {
              upc: p.upc,
              asin: p.asin,
              title: p.title,
              brand: p.brand,
              buyBoxPrice: p.buyBoxPrice,
              rank: p.rank,
              hazmat: p.hazmat,
              scannedAt: new Date(),
              category,
            },
          },
          { upsert: true }
        );

        // Queue for async Keepa scoring
        await addToQueue(p.upc, category);
        await setCachedProduct(redisKey, true, 24 * 3600); // 24h cache
        queuedCount++;
      }

      // Throttle for API safety
      await new Promise((r) => setTimeout(r, THROTTLE_MS));
    }

    res.status(200).json({
      message: `Category scan started for "${category}"`,
      queuedProducts: queuedCount,
    });
  } catch (err) {
    console.error("Category scan error:", err);
    res.status(500).json({ error: "Failed to start category scan", details: err.message });
  }
}
