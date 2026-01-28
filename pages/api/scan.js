// Next.js API Route: /api/scan
export default async function handler(req, res) {
    const { upc } = req.body;
    const marketUS = "US";
    const marketEU = "DE";

    // 1️⃣ Duplicate check
    const duplicate = await db.collection('products').findOne({ upc, market: marketEU, status: "shown" });
    if(duplicate) return res.json({ message: "Already scanned", product: duplicate });

    // 2️⃣ Redis cache check
    let productUS = await getCachedProduct(upc, marketUS);
    if(!productUS) {
        // 3️⃣ US Keepa pre-filter
        productUS = await keepaQueue.add({ upc, market: marketUS });
        // productUS = { asin, title, brand, usPrice, rank, hazmat }
    }

    // 4️⃣ US pre-filter
    if(productUS.rank > 20000 || productUS.hazmat) {
        await db.collection('products').updateOne(
            { upc, market: marketUS },
            { $set: { status: "filtered" } },
            { upsert: true }
        );
        return res.json({ message: "Filtered by US criteria" });
    }

    // 5️⃣ EU Keepa query
    let productEU = await getCachedProduct(upc, marketEU);
    if(!productEU) {
        productEU = await keepaQueue.add({ upc, market: marketEU });
    }

    // 6️⃣ Opportunity Score
    const fees = await calculateFees(productEU.asin, productEU.buyBoxPrice);
    const shipping = estimateShipping(productUS, productEU);
    const riskMultiplier = calculateRisk(productUS, productEU);
    const opportunityScore = calculateOpportunity(productUS.usPrice, productEU.buyBoxPrice, fees, shipping, riskMultiplier);

    // 7️⃣ Save to MongoDB + Redis
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

    // 8️⃣ Return to Frontend
    res.json({ product: productData });
}
