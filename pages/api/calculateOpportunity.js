// pages/api/calculateOpportunity.js
import { getCachedProduct, setCachedProduct } from '../../lib/redis';
import { db } from '../../lib/mongo';
import { callKeepaAPI, calculateFees, estimateShipping } from '../../lib/keepaUtils';

export default async function handler(req, res) {
    const { upc } = req.body;
    const marketUS = "US";
    const marketEU = "DE";

    // 1️⃣ MongoDB duplicate check
    const duplicate = await db.collection('products').findOne({ upc, market: marketEU, status: "shown" });
    if(duplicate) return res.json({ message: "Already scanned", product: duplicate });

    // 2️⃣ Redis cache check US
    let productUS = await getCachedProduct(upc, marketUS);
    if(!productUS) productUS = await callKeepaAPI(upc, marketUS);

    // 3️⃣ US pre-filter
    if(productUS.rank > 20000 || productUS.hazmat) {
        await db.collection('products').updateOne(
            { upc, market: marketUS },
            { $set: { status: "filtered" } },
            { upsert: true }
        );
        return res.json({ message: "Filtered by US criteria" });
    }

    // 4️⃣ Redis cache check EU
    let productEU = await getCachedProduct(upc, marketEU);
    if(!productEU) productEU = await callKeepaAPI(upc, marketEU);

    // 5️⃣ Fees + Shipping
    const fees = await calculateFees(productEU.asin, productEU.buyBoxPrice);
    const shipping = estimateShipping(productUS, productEU);

    // 6️⃣ Risk Multiplier
    const riskMultiplier = calculateRiskMultiplier(
        productUS.upc === productEU.upc,
        productUS.title === productEU.title,
        productUS.variationHash !== productEU.variationHash,
        productUS.hazmat || productEU.hazmat,
        false // brandGated örnek, Keepa ile kontrol edilebilir
    );

    // 7️⃣ Opportunity Score
    const opportunityScore = (productEU.buyBoxPrice - productUS.usPrice - fees - shipping) * riskMultiplier;

    // 8️⃣ Save to MongoDB + Redis
    const productData = {
        upc,
        asin: productEU.asin,
        market: marketEU,
        title: productEU.title,
        brand: productEU.brand,
        usPrice: productUS.usPrice,
        euPrice: productEU.buyBoxPrice,
        lastSeen: new Date(),
        status: "shown",
        opportunityScore
    };

    await db.collection('products').updateOne(
        { upc, market: marketEU },
        { $set: productData },
        { upsert: true }
    );
    await setCachedProduct(upc, marketEU, productData);

    // 9️⃣ Return to Frontend
    res.json({ product: productData });
}

// Risk multiplier fonksiyonu
function calculateRiskMultiplier(upcMatch, titleMatch, variation, hazmat, brandGated) {
    if(hazmat) return 0;
    let multiplier = 1.0;
    if(!upcMatch && titleMatch) multiplier *= 0.7;
    if(variation) multiplier *= 0.5;
    if(brandGated) multiplier *= 0.3;
    return multiplier;
}
