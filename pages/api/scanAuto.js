import { addToQueue } from '../../lib/keepaQueue.js';
import { getDB } from '../../lib/mongo.js';

export default async function handler(req, res) {
  const { category } = req.body;
  if(!category) return res.status(400).json({ error: "Category required" });

  const db = await getDB();
  // Kategoriye ait tüm US ürünlerini çek
  const products = await db.collection('products').find({ category }).toArray();

  // Queue'ya ekle
  for(const p of products) {
    await addToQueue(p.upc, category);
  }

  res.status(200).json({ message: `Automatic scan for ${products.length} products queued!` });
}
