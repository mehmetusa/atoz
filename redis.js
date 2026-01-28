// Node.js örnek
const redis = require('redis');
const client = redis.createClient();

async function getCachedProduct(upc, market) {
    const key = `${upc}:${market}`;
    const data = await client.get(key);
    if (data) return JSON.parse(data);
    return null;
}

async function setCachedProduct(upc, market, product) {
    const key = `${upc}:${market}`;
    await client.setEx(key, 3600, JSON.stringify(product)); // 1 saat cache
}
