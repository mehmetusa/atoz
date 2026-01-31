// pages/api/getCategoryProducts.js
import fetch from "node-fetch";
import { getDB } from "../../lib/mongo.js";

// Filtre ayarları
const categoryMaxRank = {
  toys: 60000,
  electronics: 80000,
  home: 150000,
  beauty: 40000,
  sports: 120000,
  baby: 50000,
  books: 500000,
};

const blacklistedBrands = [
  "Nike",
  "Apple",
  "Lego",
  "Disney",
  "Hasbro",
  "Sony",
];

const MAX_WEIGHT_LB = 20; // pound
const OVERSIZE_LABELS = ["oversize", "large"]; // Keepa’den gelen size info

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { category } = req.body;
  if (!category) return res.status(400).json({ error: "Category required" });

  const db = await getDB();

  // Keepa API call
  const keepaRes = await fetch(
    `https://api.keepa.com/category?key=${process.env.KEEPA_API_KEY}&domain=1&category=${category}&buybox=1`
  );
  const data = await keepaRes.json();

  if (!data.products || data.products.length === 0) {
    return res.status(404).json({ error: "No products found" });
  }

const whitelistedBrands = ["Samsung", "Sony", "LEGO"]; // opsiyonel
const blacklistedBrands = ["Nike", "Apple", "Disney"];

const filteredProducts = data.products.filter((p) => {
  const maxRank = categoryMaxRank[category] || 100000;
  if (p.bsr > maxRank) return false;
  if (p.hazmat) return false;
  if (blacklistedBrands.includes(p.brand)) return false;
  if (whitelistedBrands.length && !whitelistedBrands.includes(p.brand)) return false;
  if (p.weight && p.weight > MAX_WEIGHT_LB) return false;
  if (OVERSIZE_LABELS.includes(p.size)) return false;
  if (!p.buyBoxPrice || p.buyBoxPrice === 0) return false; // Buy Box yoksa at
  return true;
});


  // DB’ye ekle
  const ops = filteredProducts.map((p) => ({
    updateOne: {
      filter: { upc: p.upc },
      update: {
        $set: {
          upc: p.upc,
          asin: p.asin,
          title: p.title,
          brand: p.brand,
          category,
          usPrice: p.buyBoxPrice || p.price,
          lastSeen: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (ops.length > 0) {
    await db.collection("products").bulkWrite(ops);
  }

  return res.status(200).json({
    message: `Filtered ${filteredProducts.length} products for category '${category}'`,
    totalProducts: data.products.length,
    queuedProducts: filteredProducts.length,
  });
}
