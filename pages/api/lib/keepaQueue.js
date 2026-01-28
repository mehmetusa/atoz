// lib/keepaQueue.js
import Queue from 'bull';
import { getCachedProduct, setCachedProduct } from './redis.js';
import { getDB } from './mongo.js';
import { callKeepaAPI, calculateFees, estimateShipping, calculateRiskMultiplier } from './keepaUtils.js';

const keepaQueue = new Queue('keepaQueue', { redis: { host: 'localhost', port: 6379 } });

keepaQueue.process(5, async job => {
    const { upc, market, mode } = job.data;
    const db = await getDB();

    let productUS = await getCachedProduct(`${upc}:US`);
    if(!productUS) productUS = await callKeepaAPI(upc, "US");
    if(!productUS || productUS.rank > 20000 || productUS.hazmat) return;

    let productEU = await getCachedProduct(`${upc}:DE`);
    if(!productEU) productEU = await callKeepaAPI(upc, "DE");

    const fees = await calculateFees(productEU.asin, productEU.buyBoxPrice);
    const shipping = estimateShipping(productUS, productEU);
    const riskMultiplier = calculateRiskMultiplier(
        productUS.upc === productEU.upc,
        productUS.title === productEU.title,
        productUS.variationHash !== productEU.variationHash,
        productUS.hazmat || productEU.hazmat,
        false
    );

    const opportunityScore = (productEU.buyBoxPrice - productUS.usPrice - fees - shipping) * riskMultiplier;

    const productData = {
        upc,
        asin: productEU.asin,
        market: "DE",
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
        { upc, market: "DE", mode },
        { $set: productData },
        { upsert: true }
    );
    await setCachedProduct(`${upc}:DE`, productData);

    await sleep(1000); // throttling
    return productData;
});

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

export async function addToQueue(upc, market, mode) {
    await keepaQueue.add({ upc, market, mode }, { removeOnComplete: true, removeOnFail: true });
}


// // lib/keepaQueue.js
// const Queue = require('bull');
// const { getCachedProduct, setCachedProduct } = require('./redis');
// const { db } = require('./mongo');
// const { callKeepaAPI, calculateFees, estimateShipping } = require('./keepaUtils');

// const keepaQueue = new Queue('keepaQueue', { redis: { host: 'localhost', port: 6379 } });

// // Worker: token dostu, throttling
// keepaQueue.process(5, async (job) => {
//     const { upc, market, mode } = job.data;

//     let productUS = await getCachedProduct(`${upc}:US`);
//     if(!productUS) productUS = await callKeepaAPI(upc, "US");

//     if(productUS.rank > 20000 || productUS.hazmat) return;

//     let productEU = await getCachedProduct(`${upc}:DE`);
//     if(!productEU) productEU = await callKeepaAPI(upc, "DE");

//     const fees = await calculateFees(productEU.asin, productEU.buyBoxPrice);
//     const shipping = estimateShipping(productUS, productEU);

//     const riskMultiplier = calculateRiskMultiplier(
//         productUS.upc === productEU.upc,
//         productUS.title === productEU.title,
//         productUS.variationHash !== productEU.variationHash,
//         productUS.hazmat || productEU.hazmat,
//         false
//     );

//     const opportunityScore = (productEU.buyBoxPrice - productUS.usPrice - fees - shipping) * riskMultiplier;

//     const productData = {
//         upc,
//         asin: productEU.asin,
//         market: "DE",
//         title: productEU.title,
//         brand: productEU.brand,
//         usPrice: productUS.usPrice,
//         euPrice: productEU.buyBoxPrice,
//         lastSeen: new Date(),
//         status: "shown",
//         opportunityScore,
//         mode
//     };

//     await db.collection('products').updateOne(
//         { upc, market: "DE", mode },
//         { $set: productData },
//         { upsert: true }
//     );

//     await setCachedProduct(`${upc}:DE`, productData);

//     await sleep(1000); // throttling: token dostu
//     return productData;
// });

// function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// async function addToQueue(upc, market, mode) {
//     await keepaQueue.add({ upc, market, mode }, { removeOnComplete: true, removeOnFail: true });
// }

// module.exports = { addToQueue };
