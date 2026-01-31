// // /lib/amazonUtils.js
// import axios from "axios";

// const KEEPA_KEY = process.env.KEEPA_API_KEY;

// // Amazon domain mapping: US=1, UK=2, DE=3, FR=4 vb.
// const domainIds = {
//   US: 1,
//   UK: 2,
//   DE: 3,
//   FR: 4,
//   IT: 5,
//   ES: 6,
// };

// export async function getProductsFromCategory(categoryId, market = "US") {
//   const domain = domainIds[market] || domainIds.US;

//   try {
//     // Keepa Bestseller endpoint
//     const url = `https://api.keepa.com/bestsellers?key=${KEEPA_KEY}&domain=${domain}&category=${categoryId}`;
//     const { data } = await axios.get(url);

//     if (!data || !data.bestsellers || data.bestsellers.length === 0) {
//       return [];
//     }

//     // Her ürünü normalize et
//     return data.bestsellers.map((p) => ({
//       upc: p.upc || null,
//       asin: p.asin,
//       title: p.title,
//       brand: p.brand,
//       buyBoxPrice: p.buyBoxPrice ?? null,
//       salesRanks: p.salesRanks,
//     }));
//   } catch (err) {
//     console.error("Keepa API error:", err.response?.data || err.message);
//     return [];
//   }
// }
// // /lib/amazonUtils.js
// import axios from 'axios';

// const KEEPA_KEY = process.env.KEEPA_KEY;

// export async function getProductsFromCategory(categoryId) {
//   const url = `https://api.keepa.com/bestsellers?key=${KEEPA_KEY}&domain=1&category=${categoryId}`;
//   const { data } = await axios.get(url);

//   if (!data.bestsellers) return [];

//   return data.bestsellers.map(p => ({
//     upc: p.upc,
//     asin: p.asin,
//     title: p.title,
//     price: p.buyBoxPrice
//   }));
// }
// // /lib/amazonUtils.js
// import axios from "axios";

// const KEEPA_KEY = process.env.KEEPA_API_KEY;

// // Amazon domain mapping: US=1, UK=2, DE=3, FR=4 vb.
// const domainIds = {
//   US: 1,
//   UK: 2,
//   DE: 3,
//   FR: 4,
//   IT: 5,
//   ES: 6,
// };

// export async function getProductsFromCategory(categoryId, market = "US") {
//   const domain = domainIds[market] || domainIds.US;

//   try {
//     // Keepa Bestseller endpoint
//     const url = `https://api.keepa.com/bestsellers?key=${KEEPA_KEY}&domain=${domain}&category=${categoryId}`;
//     const { data } = await axios.get(url);

//     if (!data || !data.bestsellers || data.bestsellers.length === 0) {
//       return [];
//     }

//     // Her ürünü normalize et
//     return data.bestsellers.map((p) => ({
//       upc: p.upc || null,
//       asin: p.asin,
//       title: p.title,
//       brand: p.brand,
//       buyBoxPrice: p.buyBoxPrice ?? null,
//       salesRanks: p.salesRanks,
//     }));
//   } catch (err) {
//     console.error("Keepa API error:", err.response?.data || err.message);
//     return [];
//   }
// }
// import fetch from "node-fetch";

// export const BRAND_WHITELIST = ["Apple", "Samsung", "Sony"];
// export const BRAND_BLACKLIST = ["FakeBrand", "UnknownBrand"];
// export const MAX_RANK = 20000;

// // Keepa category fetch
// export async function callKeepaCategoryAPI(category) {
//   const url = `https://api.keepa.com/category?key=${process.env.KEEPA_API_KEY}&domain=1&category=${category}`;
//   const res = await fetch(url);
//   const data = await res.json();
//   if (!data.products) return [];

//   return data.products.map(p => ({
//     asin: p.asin,
//     upc: p.upc,
//     title: p.title,
//     brand: p.brand,
//     buyBoxPrice: p.buyBoxPrice || 0,
//     rank: p.salesRank ? p.salesRank[0]?.rank || 999999 : 999999,
//     hazmat: p.hazmat || false,
//     variationHash: p.variationHash,
//   }));
// }

// // Filtreleme
// export function filterProduct(p) {
//   if (!p.upc) return false;
//   if (p.rank > MAX_RANK) return false;
//   if (p.hazmat) return false;
//   if (BRAND_WHITELIST.length && !BRAND_WHITELIST.includes(p.brand)) return false;
//   if (BRAND_BLACKLIST.includes(p.brand)) return false;
//   if (!p.buyBoxPrice || p.buyBoxPrice <= 0) return false;
//   return true;
// }

// // Öncelik skoru: buyBox ve whitelist öncelikli
// export function priorityScore(p) {
//   let score = 0;
//   if (p.buyBoxPrice > 0) score += 10;
//   if (BRAND_WHITELIST.includes(p.brand)) score += 5;
//   score -= p.rank / 100000; // rank ne küçükse o kadar yüksek
//   return score;
// }

// // US -> EU Keepa fetch
// export async function callKeepaAPI(upc, region = "US") {
//   const domain = region === "US" ? 1 : region === "DE" ? 3 : 1;
//   const url = `https://api.keepa.com/product?key=${process.env.KEEPA_API_KEY}&domain=${domain}&upc=${upc}`;
//   const res = await fetch(url);
//   const data = await res.json();
//   return data.products?.[0] || null;
// }

// export async function calculateFees(asin, price) {
//   return price * 0.15;
// }

// export function estimateShipping(productUS, productEU) {
//   return 5;
// }
// // lib/keepaUtils.js

// export function calculateInternationalProfit({
//   buyBoxUS,
//   referralFee,
//   fbaFee,
//   shippingCost,
//   importCost,
//   costEU
// }) {
//   const totalCost =
//     costEU +
//     shippingCost +
//     importCost +
//     referralFee +
//     fbaFee;

//   const netProfit = buyBoxUS - totalCost;

//   const roi = totalCost > 0
//     ? (netProfit / totalCost) * 100
//     : 0;

//   return {
//     netProfit: Number(netProfit.toFixed(2)),
//     roi: Number(roi.toFixed(2)),
//     totalCost: Number(totalCost.toFixed(2))
//   };
// }
// export function extractKeepaPricing(keepaProduct) {
//   return {
//     buyBoxUS: keepaProduct.buyBoxPrice / 100,
//     referralFee: keepaProduct.referralFee,
//     fbaFee: keepaProduct.fbaFee,
//     weightKg: keepaProduct.packageWeight / 1000,
//     hazmat: keepaProduct.hazmat === true,
//     brand: keepaProduct.brand,
//     salesRank: keepaProduct.salesRank
//   };
// }
