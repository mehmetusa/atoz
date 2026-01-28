// pages/api/scanOrAuto.js
import { getCachedProduct, setCachedProduct } from '../../lib/redis';
import { db } from '../../lib/mongo';
import { callKeepaAPI, calculateFees, estimateShipping } from '../../lib/keepaUtils';
import { addToQueue } from '../../lib/keepaQueue';

export default async function handler(req, res) {
    const { upc, mode } = req.body; // mode: "manual" veya "automatic"
    const marketUS = "US";
    const marketEU = "DE";

    // 1️⃣ Duplicate Check MongoDB
    const duplicate = await db.collection('products').findOne({
        upc,
        market: marketEU,
        mode,
        status: "shown"
    });
    if(duplicate) return res.json({ message: "Already scanned", product: duplicate });

    // 2️⃣ Redis Cache
    let productUS = await getCachedProduct(`${upc}:${marketUS}`);
    if(!productUS) {
        if(mode === "manual") {
            // Direct Keepa call
            productUS = await callKeepaAPI(upc, marketUS);
        } else {
            // Automatic: add to queue, async processing
            await addToQueue(upc, marketUS, mode);
            return res.json({ message: "Added to queue for automatic processing" });
        }
    }

    // 3️⃣ US Pre-filter
    if(productUS.rank > 20000 || productUS.hazmat) {
        await db.collection('products').updateOne(
            { upc, market: marketUS, mode },
            { $set: { status: "filtered" } },
            { upsert: true }
        );
        return res.json({ message: "Filtered by US criteria" });
    }

    // 4️⃣ EU Query
    let productEU = await getCachedProduct(`${upc}:${marketEU}`);
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
        false // brandGated örnek
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
        opportunityScore,
        mode
    };

    await db.collection('products').updateOne(
        { upc, market: marketEU, mode },
        { $set: productData },
        { upsert: true }
    );
    await setCachedProduct(`${upc}:${marketEU}`, productData);

    res.json({ product: productData });
}

// Risk multiplier
function calculateRiskMultiplier(upcMatch, titleMatch, variation, hazmat, brandGated) {
    if(hazmat) return 0;
    let multiplier = 1.0;
    if(!upcMatch && titleMatch) multiplier *= 0.7;
    if(variation) multiplier *= 0.5;
    if(brandGated) multiplier *= 0.3;
    return multiplier;
}
