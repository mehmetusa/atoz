// lib/keepaUtils.js
import axios from "axios";

/* ============================================================================
   CONSTANTS
============================================================================ */


const DOMAIN = {
  US: 1,
  UK: 2,
  DE: 3,
  FR: 4,
  IT: 5,
  ES: 6
};

const AMAZON_SELLERS = [
  "ATVPDKIKX0DER", // Amazon US
  "A1AM78C64UM0Y8" // Amazon EU
];

export const FILTERS = {
  MAX_RANK: 20000,
  BRAND_WHITELIST: ["Apple", "Samsung", "Sony"],
  BRAND_BLACKLIST: ["FakeBrand", "UnknownBrand"]
};

/* ============================================================================
   API CALLS
============================================================================ */
export async function fetchKeepaByUPC(upc, market = "US") {
  const { data } = await axios.get(process.envKEEPA_BASE, {
    params: {
      key: process.env.KEEPA_KEY,
      domain: DOMAIN[market],
      code: upc,
      stats: 90,
      buybox: 1
    }
  });

  return data.products?.[0] || null;
}

/* ============================================================================
   TOKEN SAVER FILTER
============================================================================ */
export function passInitialFilter(p) {
  if (!p?.upc) return false;
  if (p.hazmat) return false;
  if (p.brand && FILTERS.BRAND_BLACKLIST.includes(p.brand)) return false;
  if (
    FILTERS.BRAND_WHITELIST.length &&
    !FILTERS.BRAND_WHITELIST.includes(p.brand)
  ) return false;

  const rank =
    p.salesRanks?.[Object.keys(p.salesRanks)[0]]?.[0] ?? 999999;

  return rank <= FILTERS.MAX_RANK;
}

/* ============================================================================
   ANALYTICS
============================================================================ */
export function getAmazonBuyBoxShare(p) {
  const stats = p.stats?.buyBoxStats;
  if (!stats) return 0;

  return AMAZON_SELLERS.reduce(
    (sum, id) => sum + (stats[id]?.percentage || 0),
    0
  );
}

export function getFBASellerTrend(p) {
  const now = p.stats?.offerCountFBA ?? 0;
  const avg30 = p.stats?.offerCountFBA30 ?? now;

  const delta = now - avg30;
  return {
    delta,
    risk: delta >= 3 ? "high" : delta >= 1 ? "medium" : "low"
  };
}

export function getCompetitionMoat(p) {
  let score = 0;

  if ((p.stats?.offerCountFBA ?? 0) <= 3) score += 30;
  if (getAmazonBuyBoxShare(p) < 5) score += 30;
  if (!p.hazmat) score += 10;
  if ((p.packageWeight ?? 0) > 2000) score += 10;

  return Math.min(score, 100);
}


/* ============================================================================
   ARBITRAGE CORE
============================================================================ */

export function opportunityScore(us, eu) {
  const fees = calculateFees(eu.buyBoxPrice);
  const shipping = estimateShipping(us.packageWeight);

  const profit =
    eu.buyBoxPrice - us.buyBoxPrice - fees - shipping;

  return {
    profit,
    roi: (profit / us.buyBoxPrice) * 100
  };
}
// lib/keepaUtils.js
import fetch from "node-fetch";

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================
export const BRAND_WHITELIST = ["Apple", "Samsung", "Sony", "LEGO", "Hasbro", "Fisher-Price"];
export const BRAND_BLACKLIST = ["FakeBrand", "UnknownBrand", "Generic", "Amazon Basics"];
export const MAX_RANK = 20000;


// Amazon Seller IDs
const AMAZON_SELLER_IDS = [
  "ATVPDKIKX0DER", // Amazon US
  "A1AM78C64UM0Y8" // Amazon EU
];

// Domain mapping: US = 1, UK = 2, DE = 3, FR = 4, IT = 5, ES = 6
const domainIds = {
  US: 1,
  UK: 2,
  DE: 3,
  FR: 4,
  IT: 5,
  ES: 6
};

// ============================================================================
// KEEPA API FUNCTIONS
// ============================================================================

/**
 * Call Keepa API by UPC
 * @param {string} upc - Product UPC
 * @param {string} market - Market code (US, DE, UK, etc.)
 * @returns {Promise<Object|null>} Product data
 */
export async function callKeepaAPI(upc, market = "US") {
  const domain = domainIds[market] || domainIds.US;
  const url = `${process.env.KEEPA_BASE}/product?key=${process.env.KEEPA_KEY}&domain=${domain}&code=${upc}&buyBox=1&stats=180`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.products || !data.products.length) return null;

    const p = data.products[0];

    return {
      upc: p.upc,
      asin: p.asin,
      title: p.title,
      brand: p.brand,
      usPrice: p.stats?.current?.[0] ? p.stats.current[0] / 100 : null,
      buyBoxPrice: p.stats?.buyBoxPrice ? p.stats.buyBoxPrice / 100 : p.stats?.current?.[0] / 100,
      buyBoxSellerId: p.stats?.buyBoxSellerId ?? null,
      csv: p.csv,
      salesRanks: p.salesRanks,
      rank: p.salesRanks?.[Object.keys(p.salesRanks || {})[0]]?.[0] ?? 999999,
      hazmat: p.hazmat === true,
      variationHash: p.variationHash,
      variationCount: p.variationCount || 0,
      packageWeight: p.packageWeight,
      weightKg: p.packageWeight ? p.packageWeight / 1000 : null,
      packageDimensions: p.packageDimensions,
      packageVolume: p.packageVolume,
      fbaFees: p.fbaFees,
      referralFeePercentage: p.referralFeePercentage,
      priceHistory: p.csv?.[0] || [], // Amazon price history
      history: {
        price: p.csv?.[0] || [],
        salesRank: p.csv?.[3] || []
      },
      stats: p.stats,
      offerCount: p.stats?.offerCount || 0,
      offerCountFBA: p.stats?.offerCountFBA || 0,
      offerCountFBA30: p.stats?.offerCountFBA30 || 0,
      offerCountFBA90: p.stats?.offerCountFBA90 || 0,
      totalSellers: p.stats?.offerCount || 1,
      buyBoxOwners: p.stats?.buyBoxSellerId ? [p.stats.buyBoxSellerId] : [],
      buyBoxWinnerCount: p.buyBoxWinnerCount || 0,
      buyBoxShareAmazon: p.stats?.buyBoxShareAmazon || 0,
      category: p.rootCategory || p.categoryTree?.[0]?.name || "uncategorized"
    };
  } catch (err) {
    console.error("Keepa API error:", err.response?.data || err.message);
    return null;
  }
}

/**
 * Fetch Keepa product with detailed stats
 * @param {string} asin - Product ASIN
 * @param {string} marketplace - Marketplace ID
 * @returns {Promise<Object|null>}
 */
export async function fetchKeepaProduct(asin, marketplace) {
  const res = await axios.get(`${process.env.KEEPA_BASE}/product`, {
    params: {
      key: KEEPA_KEY,
      domain: marketplace,
      asin,
      stats: 90,
      buybox: 1,
    },
  });

  const p = res.data.products?.[0];
  if (!p) return null;

  return {
    title: p.title,
    brand: p.brand,
    hazmat: p.hazmat === true,
    salesRank: p.salesRanks?.[Object.keys(p.salesRanks)[0]]?.[0] ?? null,
    buyBoxPrice: p.stats?.buyBoxPrice ? p.stats.buyBoxPrice / 100 : null,
    buyBoxSellerId: p.stats?.buyBoxSellerId ?? null,
    fbaFee: p.fbaFees?.storageFee ?? null,
    referralFee: p.referralFeePercentage,
    weight: p.packageWeight,
    size: p.packageDimensions,
    stats: p.stats,
    csv: p.csv,
    history: {
      price: p.csv?.[0] || [],
      salesRank: p.csv?.[3] || []
    }
  };
}

/**
 * Get products by ASINs in bulk
 * @param {Array<string>} asins - Array of ASINs
 * @returns {Promise<Array>}
 */
export async function getProducts(asins) {
  const { data } = await axios.get(`${process.env.KEEPA_BASE}/product`, {
    params: {
      key: KEEPA_KEY,
      domain: 1,
      asin: asins.join(","),
      stats: 180
    }
  });
  return data.products || [];
}

/**
 * Call Keepa Category API
 * @param {string} category - Category name
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
export async function callKeepaCategoryAPI(category, options = {}) {
  const { 
    domain = "com", 
    maxRank = 20000, 
    hazmat = false, 
    weightLimit, 
    sizeLimit 
  } = options;

  const domainId = domainIds[domain.toUpperCase()] || 1;
  const url = `${process.env.KEEPA_BASE}/category?key=${process.env.KEEPA_KEY}&domain=${domainId}&category=${category}&buyBox=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.products) return [];

    // Filter products
    let products = data.products.filter(p => {
      if (hazmat !== undefined && p.hazmat !== hazmat) return false;
      if (maxRank && p.rank > maxRank) return false;
      if (weightLimit && p.weight && p.weight > weightLimit) return false;
      if (sizeLimit && p.size && p.size > sizeLimit) return false;
      return true;
    });

    return products.map(p => ({
      asin: p.asin,
      upc: p.upc,
      title: p.title,
      brand: p.brand,
      buyBoxPrice: p.buyBoxPrice || 0,
      rank: p.salesRank ? p.salesRank[0]?.rank || 999999 : 999999,
      hazmat: p.hazmat || false,
      variationHash: p.variationHash,
      weight: p.weight,
      size: p.size,
      category: category,
    }));
  } catch (err) {
    console.error("Keepa Category API error:", err.message);
    return [];
  }
}


// ============================================================================
// FEE & SHIPPING CALCULATIONS
// ============================================================================

/**
 * Calculate Amazon fees
 * @param {string} asin - Product ASIN
 * @param {number} price - Product price
 * @returns {Promise<number>}
 */
export async function calculateFees(asin, price) {
  const referralFee = price * 0.15; // 15% referral fee
  const fbaFee = 3.5; // Example FBA fee
  return referralFee + fbaFee;
}

/**
 * Estimate shipping cost
 * @param {Object} productUS - US product data
 * @param {Object} productEU - EU product data
 * @returns {number}
 */
export function estimateShipping(productUS, productEU) {
  const base = 5; // Base cost $5
  const weight = productUS.weight || productUS.packageWeight || 0;
  const weightCost = weight ? (weight / 1000) * 6.5 : 0; // $6.5 per kg
  return base + weightCost;
}

// ============================================================================
// RISK & OPPORTUNITY CALCULATIONS
// ============================================================================

/**
 * Calculate risk multiplier
 * @param {boolean} isSameUPC - UPC matches
 * @param {boolean} isTitleMatch - Title matches
 * @param {boolean} isVariationDiff - Variation mismatch
 * @param {boolean} isHazmat - Is hazmat product
 * @param {boolean} otherFlag - Other risk factor
 * @returns {number}
 */
export function calculateRiskMultiplier(
  isSameUPC, 
  isTitleMatch, 
  isVariationDiff, 
  isHazmat, 
  otherFlag = false
) {
  let risk = 1;

  if (!isSameUPC) risk *= 0.9;
  if (!isTitleMatch) risk *= 0.85;
  if (isVariationDiff) risk *= 0.95;
  if (isHazmat) risk *= 0.7;
  if (otherFlag) risk *= 0.9;

  return risk;
}

/**
 * Calculate opportunity score
 * @param {Object} productUS - US product data
 * @param {Object} productEU - EU product data
 * @returns {Object}
 */
export function calculateOpportunity(productUS, productEU) {
  const fees = calculateFees(productEU.asin, productEU.buyBoxPrice);
  const shipping = estimateShipping(productUS, productEU);
  const riskMultiplier = calculateRiskMultiplier(
    productUS.upc === productEU.upc,
    productUS.title === productEU.title,
    productUS.variationHash !== productEU.variationHash,
    productUS.hazmat || productEU.hazmat
  );

  const opportunityScore = (
    productEU.buyBoxPrice - 
    productUS.usPrice - 
    fees - 
    shipping
  ) * riskMultiplier;

  return {
    opportunityScore,
    fees,
    shipping,
    riskMultiplier
  };
}

/**
 * Calculate profit score
 * @param {Object} product - Product data
 * @returns {number}
 */
export function calculateProfitScore(product) {
  const buyBox = product.buyBoxPrice || 0;
  const usPrice = product.usPrice || product.csvCurrentPrice || 0;
  const fees = buyBox * 0.15;
  const shipping = 5;
  return Math.round(buyBox - usPrice - fees - shipping);
}


/**
 * Calculate scores for product comparison
 * @param {Object} usProduct - US product
 * @param {Object} euProduct - EU product
 * @returns {Object}
 */
export function calculateScores(usProduct, euProduct) {
  const netProfit = euProduct.buyBoxPrice - usProduct.usPrice;
  const roi = (netProfit / usProduct.usPrice) * 100;

  const profitScore = Math.min(10, Math.floor(netProfit));
  const velocityScore = 8; // Placeholder
  const stabilityScore = 8; // Placeholder
  const competitionScore = 7; // Placeholder
  const finalScore = (
    profitScore * 0.35 + 
    velocityScore * 0.3 + 
    stabilityScore * 0.2 + 
    competitionScore * 0.15
  ).toFixed(1);

  return { 
    netProfit, 
    roi, 
    profitScore, 
    velocityScore, 
    stabilityScore, 
    competitionScore, 
    finalScore 
  };
}

// ============================================================================
// COMPETITION ANALYSIS
// ============================================================================

/**
 * Calculate competition moat score
 * @param {Object} product - Product data
 * @returns {number}
 */
export function calculateCompetitionMoat(product) {
  const sellerCount = product.offerCount || product.totalSellers || 1;
  const amazonOwnsBB = product.buyBoxSellerId === "ATVPDKIKX0DER";
  
  let score = 100 - sellerCount * 10;
  if (amazonOwnsBB) score -= 20;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get detailed competition moat score
 * @param {Object} product - Product data
 * @param {Object} brandConfig - Brand configuration
 * @returns {Object}
 */
export function getCompetitionMoatScore(product, brandConfig = {}) {
  let score = 0;

  // 1️⃣ FBA Seller Count
  const fba = product.stats?.offerCountFBA ?? product.offerCountFBA ?? 0;
  if (fba <= 2) score += 30;
  else if (fba <= 5) score += 20;
  else if (fba <= 10) score += 10;

  // 2️⃣ Amazon presence
  const amazonBB = product.buyBoxSellerId === "ATVPDKIKX0DER";
  if (!amazonBB) score += 25;
  else if (product.buyBoxShareAmazon < 5) score += 10;

  // 3️⃣ Brand gate
  if (brandConfig.whitelist?.includes(product.brand)) score += 15;
  else if (brandConfig.blacklist?.includes(product.brand)) score -= 20;

  // 4️⃣ Physical barriers
  if (product.hazmat === false) score += 5;
  if ((product.packageWeight ?? 0) > 2000) score += 5;
  if ((product.packageVolume ?? 0) > 30000) score += 5;

  // 5️⃣ Buy Box stability
  if (product.buyBoxWinnerCount <= 2) score += 15;
  else if (product.buyBoxWinnerCount <= 4) score += 8;

  return {
    score: Math.max(0, Math.min(100, score)),
    level: score >= 70 ? "strong_moat" : score >= 50 ? "medium_moat" : "weak_moat"
  };
}

/**
 * Compute competition moat
 * @param {Object} productEU - EU product data
 * @returns {number}
 */
export function computeCompetitionMoat(productEU) {
  let score = 50;
  if (productEU.variationCount > 5) score -= 10;
  if ((productEU.sellerCount || productEU.totalSellers || 0) > 10) score -= 10;
  return Math.max(score, 0);
}

/**
 * Get competition multiplier
 * @param {Object} productEU - EU product data
 * @returns {number}
 */
export function getCompetitionMultiplier(productEU) {
  const totalSellers = productEU.totalSellers || productEU.offerCount || 1;
  const buyBoxOwnership = productEU.buyBoxOwners || [];
  const amazonBuyBoxPercent = buyBoxOwnership.includes("Amazon") 
    ? (100 / totalSellers) 
    : 0;
  
  return Math.max(0.5, 1 - amazonBuyBoxPercent / 100);
}

/**
 * Calculate competition score
 * @param {Object} productEU - EU product data
 * @returns {number}
 */
export function calculateCompetitionScore(productEU) {
  return getCompetitionMultiplier(productEU);
}

// ============================================================================
// BUY BOX ANALYSIS
// ============================================================================

/**
 * Get Amazon Buy Box percentage
 * @param {Object} keepaProduct - Keepa product data
 * @returns {number}
 */
export function getAmazonBuyBoxPercentage(keepaProduct) {
  if (!keepaProduct.stats || !keepaProduct.stats.buyBoxStats) {
    return 0;
  }

  let amazonPercentage = 0;

  for (const sellerId of AMAZON_SELLER_IDS) {
    if (keepaProduct.stats.buyBoxStats[sellerId]) {
      amazonPercentage += keepaProduct.stats.buyBoxStats[sellerId].percentage || 0;
    }
  }

  return Number(amazonPercentage.toFixed(2));
}

/**
 * Get Amazon Buy Box percent (alternative implementation)
 * @param {Object} productEU - EU product data
 * @returns {number}
 */
export function getAmazonBuyBoxPercent(productEU) {
  return getAmazonBuyBoxPercentage(productEU);
}

/**
 * Calculate Buy Box ownership
 * @param {string} asin - Product ASIN
 * @param {string} market - Market code
 * @returns {Promise<number>}
 */
export async function calculateBuyBoxOwnership(asin, market) {
  const data = await callKeepaAPIByASIN(asin, market);
  if (!data) return 0;
  
  return data.buyBoxSellerId && AMAZON_SELLER_IDS.includes(data.buyBoxSellerId) ? 100 : 0;
}

// ============================================================================
// PRICE ANALYSIS
// ============================================================================

/**
 * Predict price crash
 * @param {Object} product - Product data
 * @returns {Object}
 */
export function predictPriceCrash(product) {
  const prices = product.history?.price || product.priceHistory || [];
  if (prices.length < 2) return { score: 0, level: "unknown" };

  // 1️⃣ Recent price drop
  const recentDrop = (prices[0] - prices[prices.length - 1]) / prices[0];
  let recentPriceDropScore = Math.min(100, Math.max(0, recentDrop * 100));

  // 2️⃣ Sales rank volatility
  const ranks = product.history?.salesRank || product.salesRanks || [];
  const mean = ranks.reduce((a, b) => a + b, 0) / ranks.length || 0;
  const variance = ranks.reduce((a, b) => a + (b - mean) ** 2, 0) / ranks.length || 0;
  const rankVolatilityScore = Math.min(100, variance / 1000);

  // 3️⃣ Amazon Buy Box impact
  const amazonBB = product.buyBoxSellerId === "ATVPDKIKX0DER";
  const amazonBBImpact = amazonBB ? 30 : 0;

  // 4️⃣ Seasonality
  const month = new Date().getMonth() + 1;
  const seasonalFactor = ([11, 12].includes(month) && product.category === "toys") ? 10 : 0;

  const totalScore = 
    0.4 * recentPriceDropScore + 
    0.3 * rankVolatilityScore + 
    0.2 * amazonBBImpact + 
    0.1 * seasonalFactor;

  let level = "low";
  if (totalScore > 70) level = "high";
  else if (totalScore > 40) level = "medium";

  return { 
    score: Math.round(totalScore), 
    level 
  };
}

/**
 * Calculate price stability
 * @param {Object} productEU - EU product data
 * @returns {number}
 */
export function calculatePriceStability(productEU) {
  const prices = productEU.history?.price || productEU.priceHistory || [];
  if (prices.length < 2) return 50; // Default medium stability

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / mean) * 100;

  // Lower CV = higher stability
  const stability = Math.max(0, Math.min(100, 100 - coefficientOfVariation));
  return Math.round(stability);
}

/**
 * Get crash risk
 * @param {Object} productEU - EU product data
 * @returns {number}
 */
export function getCrashRisk(productEU) {
  const crashData = predictPriceCrash(productEU);
  return crashData.score / 100; // Return as 0-1 scale
}

// ============================================================================
// SALES ANALYSIS
// ============================================================================

/**
 * Calculate sales velocity
 * @param {Object} productEU - EU product data
 * @returns {number}
 */
export function calculateSalesVelocity(productEU) {
  const salesRanks = productEU.salesRanks || productEU.history?.salesRank || [];
  if (salesRanks.length < 2) return 0.5; // Default medium velocity

  const delta = salesRanks[salesRanks.length - 1] - salesRanks[0];
  return delta < 0 ? 1 : 0.5; // Rank improved = high velocity
}

/**
 * Get sales velocity
 * @param {Object} productEU - EU product data
 * @returns {number}
 */
export function getSalesVelocity(productEU) {
  return calculateSalesVelocity(productEU);
}

// ============================================================================
// SELLER & TREND ANALYSIS
// ============================================================================

/**
 * Get Amazon restock risk
 * @param {Object} keepaProduct - Keepa product data
 * @returns {number}
 */
export function getAmazonRestockRisk(keepaProduct) {
  let risk = 0;

  const amazonBB = keepaProduct.stats?.buyBoxStats?.ATVPDKIKX0DER;

  // 1️⃣ Amazon Buy Box history
  if (amazonBB?.lastSeenDaysAgo !== undefined) {
    if (amazonBB.lastSeenDaysAgo <= 30) risk += 50;
    else if (amazonBB.lastSeenDaysAgo <= 90) risk += 30;
  }

  // 2️⃣ Amazon price history
  const amazonPrices = keepaProduct.priceAmazon || keepaProduct.history?.price || [];
  if (amazonPrices && amazonPrices.length > 0) {
    const lastAmazonPrice = amazonPrices[amazonPrices.length - 1];
    if (lastAmazonPrice > 0) risk += 30;
  }

  // 3️⃣ Amazon seller count
  if (keepaProduct.stats?.amazonSellerCount > 0) {
    risk += 20;
  }

  // 4️⃣ Category-based risk
  const riskyCategories = ["Grocery", "Electronics"];
  if (riskyCategories.includes(keepaProduct.category)) {
    risk += 15;
  }

  return Math.min(risk, 100);
}

/**
 * Get FBA seller trend score
 * @param {Object} keepaProduct - Keepa product data
 * @returns {Object}
 */
export function getFBASellerTrendScore(keepaProduct) {
  const stats = keepaProduct.stats || {};

  const now = stats.offerCountFBA ?? 0;
  const avg30 = stats.offerCountFBA30 ?? now;
  const avg90 = stats.offerCountFBA90 ?? avg30;

  const delta30 = now - avg30;
  const delta90 = now - avg90;

  let score = 0;

  // 30-day trend
  if (delta30 >= 3) score += 40;
  else if (delta30 === 2) score += 25;
  else if (delta30 === 1) score += 15;
  else if (delta30 === -1) score -= 10;
  else if (delta30 <= -2) score -= 20;

  // 90-day confirmation
  if (delta90 >= 3) score += 20;
  else if (delta90 <= -2) score -= 10;

  return {
    score,
    delta30,
    delta90,
    status: score >= 40 ? "high_risk" : score >= 20 ? "medium_risk" : "low_risk"
  };
}

/**
 * Compute seller trend
 * @param {string} asin - Product ASIN
 * @param {string} market - Market code
 * @returns {Promise<Array>}
 */
export async function computeSellerTrend(asin, market) {
  const data = await callKeepaAPIByASIN(asin, market);
  if (!data) return [];
  
  return data.sellerCountHistory || [];
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================
export default {
  // API functions
  callKeepaAPI,
  callKeepaAPIByASIN,
  callKeepaCategoryAPI,
  fetchKeepaProduct,
  getProducts,
  
  // Filtering
  filterProduct,
  priorityScore,
  
  // Calculations
  calculateFees,
  estimateShipping,
  calculateRiskMultiplier,
  calculateOpportunity,
  calculateProfitScore,
  calculateInternationalProfit,
  extractKeepaPricing,
  calculateScores,
  
  // Competition
  calculateCompetitionMoat,
  getCompetitionMoatScore,
  computeCompetitionMoat,
  getCompetitionMultiplier,
  calculateCompetitionScore,
  
  // Buy Box
  getAmazonBuyBoxPercentage,
  getAmazonBuyBoxPercent,
  calculateBuyBoxOwnership,
  
  // Price
  predictPriceCrash,
  calculatePriceStability,
  getCrashRisk,
  
  // Sales
  calculateSalesVelocity,
  getSalesVelocity,
  
  // Trends
  getAmazonRestockRisk,
  getFBASellerTrendScore,
  computeSellerTrend,
  
  // Constants
  BRAND_WHITELIST,
  BRAND_BLACKLIST,
  MAX_RANK
};

const KEEPA_KEY = process.env.KEEPA_API_KEY;


export async function getProductsFromCategory(categoryId, market = "US") {
  const domain = domainIds[market] || domainIds.US;

  try {
    // Keepa Bestseller endpoint
    const url = `https://api.keepa.com/bestsellers?key=${process.env.KEEPA_API_KEY}&domain=${domain}&category=${categoryId}`;
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

// Filtreleme
export function filterProduct(p) {
  if (!p.upc) return false;
  if (p.rank > MAX_RANK) return false;
  if (p.hazmat) return false;
  if (BRAND_WHITELIST.length && !BRAND_WHITELIST.includes(p.brand)) return false;
  if (BRAND_BLACKLIST.includes(p.brand)) return false;
  if (!p.buyBoxPrice || p.buyBoxPrice <= 0) return false;
  return true;
}

// Öncelik skoru: buyBox ve whitelist öncelikli
export function priorityScore(p) {
  let score = 0;
  if (p.buyBoxPrice > 0) score += 10;
  if (BRAND_WHITELIST.includes(p.brand)) score += 5;
  score -= p.rank / 100000; // rank ne küçükse o kadar yüksek
  return score;
}


export function calculateInternationalProfit({
  buyBoxUS,
  referralFee,
  fbaFee,
  shippingCost,
  importCost,
  costEU
}) {
  const totalCost =
    costEU +
    shippingCost +
    importCost +
    referralFee +
    fbaFee;

  const netProfit = buyBoxUS - totalCost;

  const roi = totalCost > 0
    ? (netProfit / totalCost) * 100
    : 0;

  return {
    netProfit: Number(netProfit.toFixed(2)),
    roi: Number(roi.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2))
  };
}
export function extractKeepaPricing(keepaProduct) {
  return {
    buyBoxUS: keepaProduct.buyBoxPrice / 100,
    referralFee: keepaProduct.referralFee,
    fbaFee: keepaProduct.fbaFee,
    weightKg: keepaProduct.packageWeight / 1000,
    hazmat: keepaProduct.hazmat === true,
    brand: keepaProduct.brand,
    salesRank: keepaProduct.salesRank
  };
}
