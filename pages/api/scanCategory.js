// pages/api/scanCategory.js
import fetch from "node-fetch";
import { getDB } from "../../lib/mongo.js";

// --- Filtreleme ayarları ---
const categoryMaxRank = {
  toys: 5000,
  electronics: 20000,
  home: 15000,
  books: 50000,
};

const MAX_WEIGHT_LB = 50;
const OVERSIZE_LABELS = ["Large", "Oversize"];

const whitelistedBrands = ["Samsung", "Sony", "LEGO"]; // opsiyonel
const blacklistedBrands = ["Nike", "Apple", "Disney"];  // opsiyonel

export default async function handler(req, res) {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: "Category required" });

  try {
    // 1️⃣ Keepa API call
    const keepaRes = await fetch(
      `https://api.keepa.com/category?key=${process.env.KEEPA_API_KEY}&domain=1&category=${category}&buybox=1&history=0`
    );
    const data = await keepaRes.json();

    if (!data.products || data.products.length === 0) {
      return res.status(200).json({ message: "No products found in Keepa." });
    }

    // 2️⃣ Filtreleme
    const filteredProducts = data.products.filter((p) => {
      const maxRank = categoryMaxRank[category] || 100000;
      if (p.bsr > maxRank) return false;       // Rank filtresi
      if (p.hazmat) return false;             // Hazmat filtresi
      if (blacklistedBrands.includes(p.brand)) return false; // blacklist
      if (whitelistedBrands.length && !whitelistedBrands.includes(p.brand)) return false; // whitelist
      if (p.weight && p.weight > MAX_WEIGHT_LB) return false; // ağırlık
      if (OVERSIZE_LABELS.includes(p.size)) return false;     // oversize
      if (!p.buyBoxPrice || p.buyBoxPrice === 0) return false; // BuyBox yok
      return true;
    });

    // 3️⃣ DB upsert
    const db = await getDB();
    const results = [];
    for (const p of filteredProducts) {
      const upsertResult = await db.collection("products").updateOne(
        { asin: p.asin },
        { $set: { ...p, category, lastSeen: new Date() } },
        { upsert: true }
      );
      results.push(upsertResult);
    }

    return res.status(200).json({
      message: `Filtered ${filteredProducts.length} products for category ${category} and saved to DB.`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch products from Keepa." });
  }
}
