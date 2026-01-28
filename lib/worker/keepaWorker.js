keepaQueue.process(5, async job => { // 5 parallel worker
    const { upc, category } = job.data;
  
    // Duplicate check
    if(await getCachedProduct(upc)) return;
  
    try {
      // 1️⃣ US + EU Keepa API
      const usProduct = await callKeepaAPI(upc, "US");
      const euProduct = await callKeepaAPI(upc, "DE");
      if(!usProduct || !euProduct) throw new Error("Product not found");
  
      // 2️⃣ Skor Hesaplama
      const scores = calculateScores(usProduct, euProduct);
  
      // 3️⃣ MongoDB upsert
      const db = await getDB();
      await db.collection('opportunities').updateOne(
        { upc, marketPair: "US-DE" },
        { $set: { ...scores, status: "new", updatedAt: new Date() } },
        { upsert: true }
      );
  
      // 4️⃣ Redis Cache
      await setCachedProduct(upc, scores);
  
      // 5️⃣ Token dostu throttling
      await new Promise(r => setTimeout(r, 1000)); // 1 saniye delay
    } catch(err) {
      console.error(`Error processing ${upc}:`, err.message);
      // Retry logic
      if(!job.attemptsMade || job.attemptsMade < 3) throw err;
    }
  });
  
  
  // import { keepaQueue } from '../lib/keepaQueue.js';
// import { callKeepaAPI, calculateScores } from '../lib/keepaUtils.js';
// import { getDB } from '../lib/mongo.js';
// import { setCachedProduct } from '../lib/redis.js';

// keepaQueue.process(5, async job => {
//   const { upc, category } = job.data;
//   const db = await getDB();

//   // 1️⃣ US ürünü
//   const usProduct = await callKeepaAPI(upc, "US");
//   if(!usProduct) return;

//   // 2️⃣ EU ürünü
//   const euProduct = await callKeepaAPI(upc, "DE");
//   if(!euProduct) return;

//   // 3️⃣ Skor hesaplama
//   const { netProfit, roi, profitScore, velocityScore, stabilityScore, competitionScore, finalScore } = calculateScores(usProduct, euProduct);

//   // 4️⃣ MongoDB upsert
//   const productData = {
//     upc, asinUS: usProduct.asin, asinEU: euProduct.asin,
//     marketPair: "US-DE",
//     pricing: { usPrice: usProduct.usPrice, euPrice: euProduct.buyBoxPrice, netProfit, roi },
//     scores: { profitScore, velocityScore, stabilityScore, competitionScore, finalScore },
//     status: "new",
//     createdAt: new Date()
//   };

//   await db.collection('opportunities').updateOne(
//     { upc, marketPair: "US-DE" },
//     { $set: productData },
//     { upsert: true }
//   );

//   // 5️⃣ Redis cache
//   await setCachedProduct(upc, productData);

//   // 6️⃣ Throttle
//   await new Promise(r => setTimeout(r, 1000));

//   return productData;
// });
