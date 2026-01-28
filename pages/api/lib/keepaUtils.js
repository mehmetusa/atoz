// lib/keepaUtils.js
import fetch from 'node-fetch';

const KEEP_API = process.env.KEEP_API_KEY;

export async function callKeepaAPI(upc, market) {
    const url = `https://api.keepa.com/product?key=${KEEP_API}&domain=${market === "US" ? 1 : 3}&code=${upc}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if(!data.products || data.products.length === 0) return null;

    const product = data.products[0];

    return {
        upc: product.upc,
        asin: product.asin,
        title: product.title,
        brand: product.brand,
        buyBoxPrice: product.buyBoxPrice || product.csv[0].slice(-1)[0], // fallback
        rank: product.salesRank ? product.salesRank[0] : 99999,
        variationHash: product.variation ? JSON.stringify(product.variation) : null,
        hazmat: product.hazmat || false
    };
}

// Fees hesaplama (Amazon referral + FBA örnek)
export async function calculateFees(asin, price) {
    // basit örnek: 15% referral + 3$ FBA
    return price * 0.15 + 300; // cents
}

// Tahmini shipping US → EU
export function estimateShipping(usProduct, euProduct) {
    // basit örnek: ürün ağırlığına göre USD cents
    const weightKg = usProduct.weight || 1;
    return weightKg * 500; // 5$ per kg → cents
}

// Risk multiplier
export function calculateRiskMultiplier(upcMatch, titleMatch, variation, hazmat, brandGated) {
    if(hazmat) return 0;
    let multiplier = 1.0;
    if(!upcMatch && titleMatch) multiplier *= 0.7;
    if(variation) multiplier *= 0.5;
    if(brandGated) multiplier *= 0.3;
    return multiplier;
}
