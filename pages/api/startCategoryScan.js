// pages/api/startCategoryScan.js
import { addToQueue } from '../../lib/keepaQueue';
import { getProductsFromCategory } from '../../lib/amazonUtils'; // Amazon API / Keepa toplu query

export default async function handler(req, res) {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: "Kategori gerekli" });

    const products = await getProductsFromCategory(category); // US market ürünleri

    for(const prod of products) {
        await addToQueue(prod.upc, "US", "automatic"); // queue’ya ekle
    }

    res.json({ message: `Kategori ${category} için queue başlatıldı`, queuedProducts: products.length });
}
