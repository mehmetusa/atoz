import fetch from 'node-fetch';

export async function callKeepaAPI(upc, domain) {
  const key = process.env.KEEPA_API_KEY;
  const res = await fetch(`https://api.keepa.com/product?key=${key}&domain=${domain}&code=${upc}`);
  const data = await res.json();
  if(!data.products || !data.products.length) return null;
  return {
    asin: data.products[0].asin,
    title: data.products[0].title,
    usPrice: data.products[0].stats.current[0] / 100,
    buyBoxPrice: data.products[0].stats.current[0] / 100,
    csv: data.products[0].csv,
    salesRanks: data.products[0].salesRanks
  };
}

// Örnek skor hesaplama
export function calculateScores(usProduct, euProduct) {
  const netProfit = euProduct.buyBoxPrice - usProduct.usPrice;
  const roi = netProfit / usProduct.usPrice * 100;

  const profitScore = Math.min(10, Math.floor(netProfit));
  const velocityScore = 8; // örnek placeholder
  const stabilityScore = 8;
  const competitionScore = 7;
  const finalScore = (profitScore*0.35 + velocityScore*0.3 + stabilityScore*0.2 + competitionScore*0.15).toFixed(1);

  return { netProfit, roi, profitScore, velocityScore, stabilityScore, competitionScore, finalScore };
}
