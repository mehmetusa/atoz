const Queue = require('bull');
const { getCachedProduct, setCachedProduct } = require('./redis');
const { db } = require('./mongo');
const { callKeepaAPI } = require('./keepaUtils');

const keepaQueue = new Queue('keepaQueue', { redis: { host: 'localhost', port: 6379 } });

// Worker: token dostu, throttling ile
keepaQueue.process(5, async (job) => { // 5 paralel worker, ayarlanabilir
    const { upc, market } = job.data;

    // 1️⃣ Redis cache check
    let product = await getCachedProduct(upc, market);
    if(product) return product;

    // 2️⃣ MongoDB duplicate check
    const duplicate = await db.collection('products').findOne({ upc, market, status: "shown" });
    if(duplicate) return duplicate;

    // 3️⃣ Keepa API çağrısı
    product = await callKeepaAPI(upc, market);

    // 4️⃣ Cache & DB update
    await setCachedProduct(upc, market, product);
    await db.collection('products').updateOne(
        { upc, market },
        { $set: product },
        { upsert: true }
    );

    // 5️⃣ Throttle: token limitine göre bekleme
    await sleep(1000); // 1 saniye bekle, token hızına göre ayarla
    return product;
});

// Helper sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 6️⃣ Job ekleme örneği
async function addToQueue(upc, market) {
    await keepaQueue.add({ upc, market }, { removeOnComplete: true, removeOnFail: true });
}


// const Queue = require('bull');
// const keepaQueue = new Queue('keepaQueue', { redis: { host: 'localhost', port: 6379 } });

// keepaQueue.process(async (job) => {
//     const { upc, market } = job.data;

//     // Redis cache kontrol
//     let product = await getCachedProduct(upc, market);
//     if (product) return product;

//     // Keepa API çağrısı
//     product = await callKeepaAPI(upc, market);

//     // Redis ve MongoDB'ye yaz
//     await setCachedProduct(upc, market, product);
//     await db.collection('products').updateOne(
//         { upc, market },
//         { $set: product },
//         { upsert: true }
//     );

//     return product;
// });



