// /lib/amazonUtils.js
import axios from "axios";

const KEEPA_KEY = process.env.KEEPA_API_KEY;

// Amazon domain mapping: US=1, UK=2, DE=3, FR=4 vb.
const domainIds = {
  US: 1,
  UK: 2,
  DE: 3,
  FR: 4,
  IT: 5,
  ES: 6,
};

export async function getProductsFromCategory(categoryId, market = "US") {
  const domain = domainIds[market] || domainIds.US;

  try {
    // Keepa Bestseller endpoint
    const url = `https://api.keepa.com/bestsellers?key=${KEEPA_KEY}&domain=${domain}&category=${categoryId}`;
    const { data } = await axios.get(url);

    if (!data || !data.bestsellers || data.bestsellers.length === 0) {
      return [];
    }

    // Her ürünü normalize et
    return data.bestsellers.map((p) => ({
      upc: p.upc || null,
      asin: p.asin,
      title: p.title,
      brand: p.brand,
      buyBoxPrice: p.buyBoxPrice ?? null,
      salesRanks: p.salesRanks,
    }));
  } catch (err) {
    console.error("Keepa API error:", err.response?.data || err.message);
    return [];
  }
}
